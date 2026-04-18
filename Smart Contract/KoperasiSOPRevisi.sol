// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IDRToken
 * @dev ERC20 Token restricted to Closed-Loop Koperasi ecosystem.
 */
contract IDRToken is ERC20, Ownable {
    constructor() ERC20("Rupiah Token", "IDRT") Ownable(msg.sender) {}
    function mint(address to, uint256 amount) public onlyOwner { _mint(to, amount); }
    function burn(address from, uint256 amount) public onlyOwner { _burn(from, amount); }
    function transfer(address, uint256) public pure override returns (bool) { revert("Closed Loop: Use Withdrawal"); }
    function transferFrom(address, address, uint256) public pure override returns (bool) { revert("Closed Loop"); }
}

/**
 * @title KoperasiSimpanPinjam (Definitive JDCOOP Version)
 * @dev Optimized to prevent 'Stack too deep' while maintaining all essential SOP features.
 */
contract KoperasiSimpanPinjam is ReentrancyGuard, Ownable {
    IDRToken public idrToken;
    mapping(address => bool) public isPengurus;

    enum StatusPinjaman { Pending, Surveyed, CommitteeApproved, Aktif, Lunas, Ditolak, Macet }
    enum MemberStatus { Active, Quit }

    struct Anggota {
        bool terdaftar;
        MemberStatus status;
        string nama;
        string noHP;
        string noKTP;
        string alamat;
        uint256 simpananPokok;
        uint256 simpananWajib;
        uint256 simpananSukarela;
        uint256 shuSudahDiambil;
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
        bool isPeriodClosed;
        bool deductFeesUpfront;
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
    }

    struct SettingsParams {
        bool deductUpfront;
        bool closed;
        uint256 pokok;
        uint256 adm;
        uint256 min;
        uint256 fee;
        uint256 provisi;
        uint256 resiko;
    }

    GlobalConfig public settings;
    mapping(address => Anggota) public dataAnggota;
    mapping(uint256 => Pinjaman) public dataPinjaman;
    mapping(address => uint256) public idPinjamanAktifAnggota;
    mapping(address => SimpananBerjangka[]) public userTimeDeposits;
    mapping(address => uint256) public tagihanWajib;
    
    address[] public listAlamatAnggota;
    uint256 public idPinjamanTerakhir;
    uint256 public jumlahAnggota;
    uint256 public profitBelumDibagi;
    uint256 public totalSHUDibagikan;

    // --- Events (Audit Trail) ---
    event AnggotaBaru(address indexed user, string nama, uint256 timestamp);
    event DepositTercatat(address indexed user, uint256 jumlah, string jenis, uint256 timestamp);
    event PenarikanTercatat(address indexed user, uint256 jumlah, uint256 timestamp);
    event PinjamanDiajukan(uint256 id, address indexed peminjam, uint256 jumlah);
    event PinjamanDisetujui(uint256 id, address indexed peminjam, uint256 jatuhTempo);
    event PinjamanDitolak(uint256 id, address indexed peminjam, string alasan);
    event AngsuranMasuk(uint256 indexed loanId, address indexed peminjam, uint256 jumlah);
    event PinjamanLunas(uint256 indexed loanId, address indexed peminjam, uint256 timestamp);
    event SettingsUpdated(address indexed admin, uint256 timestamp);
    event SurveyApproved(uint256 indexed loanId, string note);
    event CommitteeApproved(uint256 indexed loanId, address committee);
    event TagihanDibuat(uint256 total, uint256 timestamp);
    event BagiHasilDirilis(uint256 total, uint256 timestamp);
    event DendaDiterapkan(uint256 indexed loanId, uint256 denda);

    modifier hanyaPengurus() { require(isPengurus[msg.sender] || msg.sender == owner(), "Bukan Pengurus"); _; }
    modifier hanyaAnggota() { require(dataAnggota[msg.sender].terdaftar, "Bukan Anggota"); _; }
    modifier openPeriod() { require(!settings.isPeriodClosed, "Periode Ditutup"); _; }

    constructor() Ownable(msg.sender) {
        isPengurus[msg.sender] = true;
        idrToken = new IDRToken();
    }

    // --- Configuration ---
    function updateGlobalSettings(SettingsParams calldata p) external hanyaPengurus {
        settings.deductFeesUpfront = p.deductUpfront;
        settings.isPeriodClosed = p.closed;
        settings.nominalSimpananPokok = p.pokok;
        settings.nominalAdmPendaftaran = p.adm;
        settings.minSaldo = p.min;
        settings.feeAdministrasi = p.fee;
        settings.feeProvisiPersen = p.provisi;
        settings.feeResikoPersen = p.resiko;
        emit SettingsUpdated(msg.sender, block.timestamp);
    }

    function updateLiquidityPool(uint256 _newBalance) external hanyaPengurus {
        settings.currentLiquidityPool = _newBalance;
    }

    // --- Membership ---
    function registerMember(RegisterParams calldata p) external hanyaPengurus {
        require(!dataAnggota[p.user].terdaftar, "Sudah terdaftar");
        
        dataAnggota[p.user] = Anggota({
            terdaftar: true,
            status: MemberStatus.Active,
            nama: p.nama,
            noHP: p.noHP,
            noKTP: p.noKTP,
            alamat: p.alamat,
            simpananPokok: settings.nominalSimpananPokok,
            simpananWajib: 0,
            simpananSukarela: 0,
            shuSudahDiambil: 0
        });

        listAlamatAnggota.push(p.user);
        jumlahAnggota++;

        uint256 totalFee = settings.nominalSimpananPokok + settings.nominalAdmPendaftaran;
        if(totalFee > 0) {
            idrToken.mint(p.user, totalFee);
            profitBelumDibagi += settings.nominalAdmPendaftaran;
            settings.currentLiquidityPool += totalFee;
        }

        emit AnggotaBaru(p.user, p.nama, block.timestamp);
    }

    // --- Accounting & JDCOOP SOP ---
    function recordDeposit(address _user, uint256 _amount, bool _isWajib) external hanyaPengurus openPeriod {
        require(dataAnggota[_user].terdaftar, "Anggota tidak valid");
        idrToken.mint(_user, _amount);
        if (_isWajib) dataAnggota[_user].simpananWajib += _amount;
        else dataAnggota[_user].simpananSukarela += _amount;
        settings.currentLiquidityPool += _amount;
        emit DepositTercatat(_user, _amount, _isWajib ? "Wajib" : "Sukarela", block.timestamp);
    }

    function memberWithdraw(uint256 _amount) external hanyaAnggota openPeriod {
        require(dataAnggota[msg.sender].simpananSukarela >= _amount, "Saldo sukarela kurang");
        require(dataAnggota[msg.sender].simpananSukarela - _amount >= settings.minSaldo, "Batas minimal saldo");
        require(settings.currentLiquidityPool >= _amount, "Likuiditas terbatas");
        
        idrToken.burn(msg.sender, _amount);
        dataAnggota[msg.sender].simpananSukarela -= _amount;
        settings.currentLiquidityPool -= _amount;
        emit PenarikanTercatat(msg.sender, _amount, block.timestamp);
    }

    function generateMonthlyBills(uint256 _nominal) external hanyaPengurus {
        for (uint i = 0; i < listAlamatAnggota.length; i++) {
            address m = listAlamatAnggota[i];
            if (dataAnggota[m].status == MemberStatus.Active) {
                tagihanWajib[m] += _nominal;
            }
        }
        emit TagihanDibuat(_nominal * jumlahAnggota, block.timestamp);
    }

    function rilisBagiHasil(uint256 _payoutAmount) external hanyaPengurus {
        require(_payoutAmount <= profitBelumDibagi, "Profit tidak cukup");
        uint256 totalCap = idrToken.totalSupply();
        require(totalCap > 0, "No members");

        for (uint i = 0; i < listAlamatAnggota.length; i++) {
            address m = listAlamatAnggota[i];
            if (dataAnggota[m].status == MemberStatus.Active) {
                uint256 share = (_payoutAmount * idrToken.balanceOf(m)) / totalCap;
                if (share > 0) {
                    idrToken.mint(m, share);
                    dataAnggota[m].simpananSukarela += share;
                }
            }
        }
        profitBelumDibagi -= _payoutAmount;
        totalSHUDibagikan += _payoutAmount;
        emit BagiHasilDirilis(_payoutAmount, block.timestamp);
    }

    // --- Loan Governance (3 Stages) ---
    function ajukanPinjaman(uint256 _amount, uint256 _tenor) external hanyaAnggota openPeriod {
        require(idPinjamanAktifAnggota[msg.sender] == 0, "Ada pinjaman aktif");
        uint256 totalSave = dataAnggota[msg.sender].simpananPokok + dataAnggota[msg.sender].simpananWajib + dataAnggota[msg.sender].simpananSukarela;
        require(_amount <= totalSave * 3, "Limit 3x Simpanan");

        idPinjamanTerakhir++;
        uint256 bunga = (_amount * 12 * _tenor) / 1200; // Flat 1% per bulan (12% per tahun)
        
        dataPinjaman[idPinjamanTerakhir] = Pinjaman({
            id: idPinjamanTerakhir,
            peminjam: msg.sender,
            jumlahPinjaman: _amount,
            totalHarusDibayar: _amount + bunga,
            sudahDibayar: 0,
            tenorBulan: _tenor,
            waktuJatuhTempo: 0,
            status: StatusPinjaman.Pending,
            surveyNote: "",
            approvedByCommittee: address(0)
        });

        idPinjamanAktifAnggota[msg.sender] = idPinjamanTerakhir;
        emit PinjamanDiajukan(idPinjamanTerakhir, msg.sender, _amount);
    }

    function approveSurvey(uint256 _id, string calldata _note) external hanyaPengurus {
        require(dataPinjaman[_id].status == StatusPinjaman.Pending, "Invalid Status");
        dataPinjaman[_id].status = StatusPinjaman.Surveyed;
        dataPinjaman[_id].surveyNote = _note;
        emit SurveyApproved(_id, _note);
    }

    function approveCommittee(uint256 _id) external hanyaPengurus {
        require(dataPinjaman[_id].status == StatusPinjaman.Surveyed, "Must be Surveyed");
        dataPinjaman[_id].status = StatusPinjaman.CommitteeApproved;
        dataPinjaman[_id].approvedByCommittee = msg.sender;
        emit CommitteeApproved(_id, msg.sender);
    }

    function setujuiPinjaman(uint256 _id) external hanyaPengurus openPeriod {
        Pinjaman storage p = dataPinjaman[_id];
        require(p.status == StatusPinjaman.CommitteeApproved, "Must be Committee Approved");
        
        uint256 feeProvisi = (p.jumlahPinjaman * settings.feeProvisiPersen) / 100;
        uint256 feeResiko = (p.jumlahPinjaman * settings.feeResikoPersen) / 100;
        uint256 totalFee = settings.feeAdministrasi + feeProvisi + feeResiko;

        uint256 disburse = p.jumlahPinjaman;
        if (settings.deductFeesUpfront) {
            disburse = p.jumlahPinjaman - totalFee;
            profitBelumDibagi += totalFee;
        } else {
            p.totalHarusDibayar += totalFee;
        }

        p.status = StatusPinjaman.Aktif;
        p.waktuJatuhTempo = block.timestamp + (p.tenorBulan * 30 days);
        
        idrToken.mint(p.peminjam, disburse);
        settings.currentLiquidityPool -= disburse;
        
        emit PinjamanDisetujui(_id, p.peminjam, p.waktuJatuhTempo);
    }

    function recordAngsuran(uint256 _id, uint256 _amount) external hanyaPengurus openPeriod {
        Pinjaman storage p = dataPinjaman[_id];
        require(p.status == StatusPinjaman.Aktif, "Pinjaman tidak Aktif");

        // Simple Late Fee logic (Denda 1 permil harian)
        if (block.timestamp > p.waktuJatuhTempo) {
            uint256 daysLate = (block.timestamp - p.waktuJatuhTempo) / 1 days;
            uint256 denda = (p.jumlahPinjaman * 1 * daysLate) / 1000;
            if (denda > 0) {
                p.totalHarusDibayar += denda;
                emit DendaDiterapkan(_id, denda);
            }
        }

        p.sudahDibayar += _amount;
        settings.currentLiquidityPool += _amount;

        if (p.sudahDibayar >= p.totalHarusDibayar) {
            p.status = StatusPinjaman.Lunas;
            idPinjamanAktifAnggota[p.peminjam] = 0;
            profitBelumDibagi += (p.totalHarusDibayar - p.jumlahPinjaman);
            emit PinjamanLunas(_id, p.peminjam, block.timestamp);
        }
        emit AngsuranMasuk(_id, p.peminjam, _amount);
    }

    // --- DeFi: Simpanan Berjangka ---
    function openSimpananBerjangka(uint256 _amount, uint256 _months) external hanyaAnggota {
        require(idrToken.balanceOf(msg.sender) >= _amount, "IDRT balance insufficient");
        idrToken.burn(msg.sender, _amount);
        
        userTimeDeposits[msg.sender].push(SimpananBerjangka({
            amount: _amount,
            lockUntil: block.timestamp + (_months * 30 days),
            interestRate: _months * 1, // e.g., 1% per month locked
            active: true
        }));
    }

    function tolakPinjaman(uint256 _id, string calldata _alasan) external hanyaPengurus {
        dataPinjaman[_id].status = StatusPinjaman.Ditolak;
        idPinjamanAktifAnggota[dataPinjaman[_id].peminjam] = 0;
        emit PinjamanDitolak(_id, dataPinjaman[_id].peminjam, _alasan);
    }
}
