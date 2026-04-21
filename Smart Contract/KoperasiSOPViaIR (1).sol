// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract IDRToken is ERC20, Ownable {
    constructor() ERC20("Rupiah Token", "IDRT") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    function transfer(address, uint256) public pure override returns (bool) {
        revert("Closed Loop: Transfer antar user tidak diizinkan. Gunakan Withdrawal.");
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("Closed Loop: Transfer antar user tidak diizinkan.");
    }
}

contract KoperasiSimpanPinjam is ReentrancyGuard, Ownable {
    using SafeERC20 for IDRToken;

    IDRToken public idrToken;
    mapping(address => bool) public isPengurus;

    enum StatusPinjaman { Pending, Surveyed, CommitteeApproved, Aktif, Lunas, Ditolak, Macet }
    enum MemberStatus { Active, Inactive, Suspended, Quit }
    enum Kolektibilitas { Lancar, DPK, KurangLancar, Diragukan, Macet }

    struct Anggota {
        bool terdaftar;
        MemberStatus status;
        string nama;
        string noHP;
        string noKTP;
        string alamat;
        string jenisKelamin;
        string pekerjaan;
        string kontakDarurat;
        uint256 simpananPokok;
        uint256 simpananWajib;
        uint256 simpananSukarela;
        uint256 shuSudahDiambil;
        uint256 branchID;
        uint256 limitPinjaman;
    }

    struct Pinjaman {
        uint256 id;
        address peminjam;
        uint256 jumlahPinjaman;
        uint256 totalHarusDibayar;
        uint256 sudahDibayar;
        uint256 tenorBulan;
        uint256 waktuJatuhTempo;
        StatusPinjaman status;
        Kolektibilitas quality;
        bool isRestructured;
        string surveyNote;
        address approvedByCommittee;
    }

    struct SimpananBerjangka {
        uint256 amount;
        uint256 lockUntil;
        uint256 interestRate;
        bool active;
    }

    struct GlobalConfig {
        bool autoCollectibility;
        bool multiBranchEnabled;
        bool deductFeesUpfront;
        bool isPeriodClosed;
        uint256 nominalSimpananPokok;
        uint256 nominalAdmPendaftaran;
        uint256 minSaldo;
        uint256 feeAdministrasi;
        uint256 feeProvisiPersen;
        uint256 feeResikoPersen;
        uint256 currentLiquidityPool;
    }

    struct RegisterParams {
        address user;
        string nama;
        string noHP;
        string noKTP;
        string alamat;
        string gender;
        string job;
        string emergency;
        uint256 branchId;
    }

    struct SettingsParams {
        bool autoColl;
        bool multiBranch;
        bool deductUpfront;
        bool closePeriod;
        uint256 pokok;
        uint256 adm;
        uint256 minSaldo;
        uint256 feeAdmin;
        uint256 feeProvisi;
        uint256 feeResiko;
    }

    GlobalConfig public settings;
    mapping(address => SimpananBerjangka[]) public userTimeDeposits;

    mapping(address => Anggota) public dataAnggota;
    mapping(uint256 => Pinjaman) public dataPinjaman;
    mapping(address => uint256) public idPinjamanAktifAnggota;
    mapping(address => uint256) public loanBalance;
    mapping(address => uint256) public tagihanWajib;

    address[] public listAlamatAnggota;
    uint256 public idPinjamanTerakhir;
    uint256 public jumlahAnggota;
    
    uint256 public bungaSimpananTahunanPersen = 5;
    uint256 public bungaPinjamanTahunanPersen = 12;
    uint256 public dendaHarianPermil = 1;

    uint256 public totalSimpananSeluruhAnggota;
    uint256 public profitBelumDibagi;
    uint256 public totalSHUDibagikan;

    event AnggotaBaru(address indexed user, string nama, uint256 timestamp);
    event DepositTercatat(address indexed user, uint256 jumlah, string jenis, uint256 timestamp);
    event PenarikanTercatat(address indexed user, uint256 jumlah, uint256 timestamp);
    event PinjamanDiajukan(uint256 id, address indexed peminjam, uint256 jumlah, uint256 tenor);
    event PinjamanDisetujui(uint256 id, address indexed peminjam, uint256 jatubTempo);
    event PinjamanDitolak(uint256 id, address indexed peminjam, string alasan);
    event AngsuranTercatat(uint256 indexed loanId, address indexed peminjam, uint256 jumlah, uint256 sisa);
    event PinjamanLunas(uint256 indexed loanId, address indexed peminjam, uint256 timestamp);
    event SettingsUpdated(address indexed admin, uint256 timestamp);
    event LiquiditySynced(uint256 newPool, uint256 timestamp);
    event SurveyApproved(uint256 indexed loanId, string note);
    event CommitteeApproved(uint256 indexed loanId, address committee);
    event MembershipClosed(address indexed member, uint256 refundAmount);
    event CollectibilityUpdated(uint256 indexed loanId, Kolektibilitas status);
    event RestrukturTercatat(uint256 indexed loanId, uint256 newTotal, uint256 newTenor);
    event MemberProfileUpdated(address indexed member, string field, uint256 timestamp);
    event TagihanDibuat(uint256 nominalTotal, uint256 timestamp);
    event BagiHasilDirilis(uint256 nominalTotal, uint256 timestamp);
    event ConfigUpdated(string key, uint256 value);
    event DendaDiterapkan(uint256 indexed loanId, uint256 denda);
    event AngsuranMasuk(uint256 indexed loanId, address indexed peminjam, uint256 jumlah);

    modifier hanyaPengurus() {
        require(isPengurus[msg.sender] || msg.sender == owner(), "Hanya Admin/Pengurus");
        _;
    }

    modifier hanyaAnggota() {
        require(dataAnggota[msg.sender].terdaftar, "Belum terdaftar anggota");
        _;
    }

    modifier openPeriod() {
        require(!settings.isPeriodClosed, "Periode transaksi sudah ditutup");
        _;
    }

    constructor() Ownable(msg.sender) {
        isPengurus[msg.sender] = true;
        idrToken = new IDRToken();
    }

    function setBungaSimpanan(uint256 _persenTahunan) external hanyaPengurus {
        require(_persenTahunan <= 9, "Regulasi: Max 9% per tahun");
        bungaSimpananTahunanPersen = _persenTahunan;
        emit ConfigUpdated("BungaSimpanan", _persenTahunan);
    }

    function setBungaPinjaman(uint256 _persenTahunan) external hanyaPengurus {
        require(_persenTahunan <= 24, "Regulasi: Max 24% per tahun");
        bungaPinjamanTahunanPersen = _persenTahunan;
        emit ConfigUpdated("BungaPinjaman", _persenTahunan);
    }

    function setDendaHarian(uint256 _permil) external hanyaPengurus {
        require(_permil <= 10, "Max 1% per hari");
        dendaHarianPermil = _permil;
        emit ConfigUpdated("DendaHarian", _permil);
    }

    function tambahPengurus(address _admin) external onlyOwner {
        isPengurus[_admin] = true;
    }

    function updateGlobalSettings(SettingsParams calldata p) external hanyaPengurus {
        settings.autoCollectibility = p.autoColl;
        settings.multiBranchEnabled = p.multiBranch;
        settings.deductFeesUpfront = p.deductUpfront;
        settings.isPeriodClosed = p.closePeriod;
        settings.nominalSimpananPokok = p.pokok;
        settings.nominalAdmPendaftaran = p.adm;
        settings.minSaldo = p.minSaldo;
        settings.feeAdministrasi = p.feeAdmin;
        settings.feeProvisiPersen = p.feeProvisi;
        settings.feeResikoPersen = p.feeResiko;
        emit SettingsUpdated(msg.sender, block.timestamp);
    }

    function updateLiquidityPool(uint256 _newBalance) external hanyaPengurus {
        settings.currentLiquidityPool = _newBalance;
        emit LiquiditySynced(_newBalance, block.timestamp);
    }

    function registerMember(RegisterParams calldata p) external hanyaPengurus nonReentrant {
        Anggota storage m = dataAnggota[p.user];
        
        require(!m.terdaftar || m.status == MemberStatus.Quit, "User sudah terdaftar dan aktif");

        bool isRejoining = m.terdaftar && m.status == MemberStatus.Quit;

        m.terdaftar = true;
        m.status = MemberStatus.Active;
        m.nama = p.nama;
        m.noHP = p.noHP;
        m.noKTP = p.noKTP;
        m.alamat = p.alamat;
        m.jenisKelamin = p.gender;
        m.pekerjaan = p.job;
        m.kontakDarurat = p.emergency;
        
        // Saldo pokok selalu di-reset mengikuti pengaturan nominal terbaru
        m.simpananPokok = settings.nominalSimpananPokok;
        m.branchID = settings.multiBranchEnabled ? p.branchId : 0;

        // PENCEGAHAN DUPLIKASI: 
        // Hanya masukkan ke dalam array dan tambah total anggota jika ini benar-benar anggota baru
        if (!isRejoining) {
            listAlamatAnggota.push(p.user);
            jumlahAnggota++;
        }

        uint256 totalEntryFee = settings.nominalSimpananPokok + settings.nominalAdmPendaftaran;
        if(totalEntryFee > 0) {
            idrToken.mint(p.user, totalEntryFee);
            totalSimpananSeluruhAnggota += settings.nominalSimpananPokok;
            profitBelumDibagi += settings.nominalAdmPendaftaran;
            settings.currentLiquidityPool += totalEntryFee;
        }

        emit AnggotaBaru(p.user, p.nama, block.timestamp);
    }

    function updateMemberProfile(
        address _user,
        string memory _nama,
        string memory _noHP,
        string memory _alamat,
        string memory _job
    ) external hanyaPengurus {
        require(dataAnggota[_user].terdaftar, "Anggota tidak terdaftar");
        
        dataAnggota[_user].nama = _nama;
        dataAnggota[_user].noHP = _noHP;
        dataAnggota[_user].alamat = _alamat;
        dataAnggota[_user].pekerjaan = _job;

        emit MemberProfileUpdated(_user, "FullProfile", block.timestamp);
    }

    function recordDeposit(address _user, uint256 _amount, bool _isWajib) external hanyaPengurus openPeriod nonReentrant {
        require(dataAnggota[_user].terdaftar, "User tidak dikenal/belum KYC");

        idrToken.mint(_user, _amount);
        
        if (_isWajib) {
            dataAnggota[_user].simpananWajib += _amount;
        } else {
            dataAnggota[_user].simpananSukarela += _amount;
        }
        totalSimpananSeluruhAnggota += _amount;
        settings.currentLiquidityPool += _amount;

        emit DepositTercatat(_user, _amount, _isWajib ? "Wajib" : "Sukarela", block.timestamp);
    }

    function recordWithdrawal(address _user, uint256 _amount) external hanyaPengurus openPeriod nonReentrant {
        uint256 currentBal = dataAnggota[_user].simpananSukarela;
        require(currentBal >= _amount, "Saldo sukarela kurang");
        require(currentBal - _amount >= settings.minSaldo, "Melampaui batas minimal saldo");
        require(settings.currentLiquidityPool >= _amount, "Likuiditas koperasi tidak cukup");
        
        idrToken.burn(_user, _amount);
        dataAnggota[_user].simpananSukarela -= _amount;
        totalSimpananSeluruhAnggota -= _amount;
        settings.currentLiquidityPool -= _amount;

        emit PenarikanTercatat(_user, _amount, block.timestamp);
    }

    function memberWithdraw(uint256 _amount) external hanyaAnggota openPeriod nonReentrant {
        uint256 currentBal = dataAnggota[msg.sender].simpananSukarela;
        require(currentBal >= _amount, "Saldo sukarela kurang");
        require(currentBal - _amount >= settings.minSaldo, "Melampaui batas minimal saldo");
        require(settings.currentLiquidityPool >= _amount, "Likuiditas koperasi tidak cukup");
        
        idrToken.burn(msg.sender, _amount);
        dataAnggota[msg.sender].simpananSukarela -= _amount;
        totalSimpananSeluruhAnggota -= _amount;
        settings.currentLiquidityPool -= _amount;

        emit PenarikanTercatat(msg.sender, _amount, block.timestamp);
    }

    function generateMonthlyBills(uint256 _nominal) external hanyaPengurus {
        for (uint i = 0; i < listAlamatAnggota.length; i++) {
            address member = listAlamatAnggota[i];
            if (dataAnggota[member].status == MemberStatus.Active) {
                tagihanWajib[member] += _nominal;
            }
        }
        emit TagihanDibuat(_nominal * jumlahAnggota, block.timestamp);
    }

    function bayarTagihanWajib(uint256 _amount) external hanyaAnggota openPeriod nonReentrant {
        require(tagihanWajib[msg.sender] >= _amount, "Melebihi tagihan");
        
        idrToken.burn(msg.sender, _amount);
        tagihanWajib[msg.sender] -= _amount;
        dataAnggota[msg.sender].simpananWajib += _amount;
        totalSimpananSeluruhAnggota += _amount;
        
        emit DepositTercatat(msg.sender, _amount, "Wajib", block.timestamp);
    }

    function rilisBagiHasil(uint256 _percentage) external hanyaPengurus nonReentrant {
        require(_percentage <= 100, "Max 100%");
        uint256 amountToDistribute = (profitBelumDibagi * _percentage) / 100;
        require(amountToDistribute > 0 && totalSimpananSeluruhAnggota > 0, "No profit/members");

        for (uint i = 0; i < listAlamatAnggota.length; i++) {
            address member = listAlamatAnggota[i];
            if (dataAnggota[member].status == MemberStatus.Active) {
                uint256 bal = idrToken.balanceOf(member);
                if (bal > 0) {
                    uint256 memberShare = (amountToDistribute * bal) / totalSimpananSeluruhAnggota;
                    if (memberShare > 0) {
                        idrToken.mint(member, memberShare);
                        dataAnggota[member].simpananSukarela += memberShare;
                    }
                }
            }
        }
        
        profitBelumDibagi -= amountToDistribute;
        totalSHUDibagikan += amountToDistribute;
        emit BagiHasilDirilis(amountToDistribute, block.timestamp);
    }

    function ajukanPinjaman(uint256 _amount, uint256 _tenorBulan) external hanyaAnggota openPeriod nonReentrant {
        require(idPinjamanAktifAnggota[msg.sender] == 0, "Ada pinjaman aktif");
        require(_amount <= _getTotalSimpanan(msg.sender) * 3, "Over limit");

        idPinjamanTerakhir++;
        uint256 bungaTotal = (_amount * bungaPinjamanTahunanPersen * _tenorBulan) / 1200;

        Pinjaman storage p = dataPinjaman[idPinjamanTerakhir];
        p.id = idPinjamanTerakhir;
        p.peminjam = msg.sender;
        p.jumlahPinjaman = _amount;
        p.totalHarusDibayar = _amount + bungaTotal;
        p.sudahDibayar = 0;
        p.tenorBulan = _tenorBulan;
        p.waktuJatuhTempo = 0;
        p.status = StatusPinjaman.Pending;
        p.quality = Kolektibilitas.Lancar;
        p.isRestructured = false;

        idPinjamanAktifAnggota[msg.sender] = idPinjamanTerakhir;
        emit PinjamanDiajukan(idPinjamanTerakhir, msg.sender, _amount, _tenorBulan);
    }

    function approveSurvey(uint256 _loanId, string memory _note) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Pending, "Status must be Pending");
        p.status = StatusPinjaman.Surveyed;
        p.surveyNote = _note;
        emit SurveyApproved(_loanId, _note);
    }

    function approveCommittee(uint256 _loanId) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Surveyed, "Status must be Surveyed");
        p.status = StatusPinjaman.CommitteeApproved;
        p.approvedByCommittee = msg.sender;
        emit CommitteeApproved(_loanId, msg.sender);
    }

    function setujuiPinjaman(uint256 _loanId) external hanyaPengurus openPeriod nonReentrant {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.CommitteeApproved, "Harus melalui tahap Komite");

        uint256 feeProvisi = (p.jumlahPinjaman * settings.feeProvisiPersen) / 100;
        uint256 feeResiko = (p.jumlahPinjaman * settings.feeResikoPersen) / 100;
        uint256 totalBiayaLainnya = settings.feeAdministrasi + feeProvisi + feeResiko;

        uint256 amountToMint = p.jumlahPinjaman;

        if (settings.deductFeesUpfront) {
            require(p.jumlahPinjaman > totalBiayaLainnya, "Biaya melebihi pinjaman");
            amountToMint = p.jumlahPinjaman - totalBiayaLainnya;
        } else {
            p.totalHarusDibayar += totalBiayaLainnya;
        }
        
        p.status = StatusPinjaman.Aktif;
        p.waktuJatuhTempo = block.timestamp + (p.tenorBulan * 30 days);
        loanBalance[p.peminjam] += p.totalHarusDibayar;

        idrToken.mint(p.peminjam, amountToMint);
        emit PinjamanDisetujui(_loanId, p.peminjam, p.waktuJatuhTempo);
    }

    function tolakPinjaman(uint256 _loanId, string memory _alasan) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Pending, "Status invalid");
        p.status = StatusPinjaman.Ditolak;
        idPinjamanAktifAnggota[p.peminjam] = 0; 
        emit PinjamanDitolak(_loanId, p.peminjam, _alasan);
    }

    function recordAngsuran(uint256 _loanId, uint256 _amount) external hanyaPengurus openPeriod nonReentrant {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Aktif, "Pinjaman tidak aktif");

        uint256 amountToPrincipal = _amount;

        if (block.timestamp > p.waktuJatuhTempo) {
            uint256 overdueDays = (block.timestamp - p.waktuJatuhTempo) / 1 days;
            if (overdueDays > 0) {
                uint256 denda = (p.totalHarusDibayar * dendaHarianPermil * overdueDays) / 1000;
                if (_amount > denda) {
                    profitBelumDibagi += denda;
                    amountToPrincipal = _amount - denda;
                } else {
                    profitBelumDibagi += _amount;
                    amountToPrincipal = 0;
                }
                emit DendaDiterapkan(_loanId, denda);
            }
        }

        p.sudahDibayar += amountToPrincipal;
        if(loanBalance[p.peminjam] >= amountToPrincipal) loanBalance[p.peminjam] -= amountToPrincipal; 
        else loanBalance[p.peminjam] = 0;

        if (p.sudahDibayar >= p.totalHarusDibayar) {
            p.status = StatusPinjaman.Lunas;
            idPinjamanAktifAnggota[p.peminjam] = 0;
            if (p.totalHarusDibayar > p.jumlahPinjaman) {
                profitBelumDibagi += (p.totalHarusDibayar - p.jumlahPinjaman);
            }
            emit PinjamanLunas(_loanId, p.peminjam, block.timestamp);
        }

        emit AngsuranMasuk(_loanId, p.peminjam, _amount);
    }

    function openSimpananBerjangka(uint256 _amount, uint256 _tenorBulan) external hanyaAnggota nonReentrant {
        require(idrToken.balanceOf(msg.sender) >= _amount, "Saldo tidak cukup");
        
        userTimeDeposits[msg.sender].push(SimpananBerjangka({
            amount: _amount,
            lockUntil: block.timestamp + (_tenorBulan * 30 days),
            interestRate: _tenorBulan * 1,
            active: true
        }));

        idrToken.burn(msg.sender, _amount);
        totalSimpananSeluruhAnggota -= _amount;
    }

    function updateCollectibilityStatus(uint256 _loanId, Kolektibilitas _status) external hanyaPengurus {
        dataPinjaman[_loanId].quality = _status;
    }

    function restrukturPinjaman(uint256 _loanId, uint256 _newTenor, uint256 _newTotal) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Aktif, "Hanya untuk pinjaman aktif");
        p.tenorBulan = _newTenor;
        p.totalHarusDibayar = _newTotal;
        p.waktuJatuhTempo = block.timestamp + (_newTenor * 30 days);
        p.isRestructured = true;
    }

    function tutupKeanggotaan(address _member) external hanyaPengurus nonReentrant {
        require(dataAnggota[_member].terdaftar, "Anggota tidak ditemukan");
        require(loanBalance[_member] == 0 && idPinjamanAktifAnggota[_member] == 0, "Ada pinjaman aktif");

        uint256 totalRefund = dataAnggota[_member].simpananPokok + dataAnggota[_member].simpananWajib + dataAnggota[_member].simpananSukarela;
        
        require(settings.currentLiquidityPool >= totalRefund, "Likuiditas koperasi tidak cukup");
        
        idrToken.burn(_member, totalRefund);
        totalSimpananSeluruhAnggota -= totalRefund;
        settings.currentLiquidityPool -= totalRefund;
        
        dataAnggota[_member].simpananPokok = 0;
        dataAnggota[_member].simpananWajib = 0;
        dataAnggota[_member].simpananSukarela = 0;
        dataAnggota[_member].status = MemberStatus.Quit;

        emit MembershipClosed(_member, totalRefund);
    }

    function _getTotalSimpanan(address _user) internal view returns (uint256) {
        return idrToken.balanceOf(_user);
    }
}
