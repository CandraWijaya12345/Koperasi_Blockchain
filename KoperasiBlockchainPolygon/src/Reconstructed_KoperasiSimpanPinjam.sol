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

    IDRToken public idrToken;
    mapping(address => bool) public isPengurus;

    enum StatusPinjaman { Pending, Aktif, Lunas, Ditolak, Macet }

    struct Anggota {
        bool terdaftar;
        string nama;
        string ktpHash; 
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
    }

    mapping(address => Anggota) public dataAnggota;
    mapping(uint256 => Pinjaman) public dataPinjaman;
    mapping(address => uint256) public idPinjamanAktifAnggota;
    mapping(address => uint256) public loanBalance; 
    
    address[] public listAlamatAnggota;
    uint256 public idPinjamanTerakhir;
    uint256 public jumlahAnggota;
    
    uint256 public bungaSimpananTahunanPersen = 5; 
    
    uint256 public bungaPinjamanTahunanPersen = 12; 
    
    uint256 public dendaHarianPermil = 1;

    uint256 public totalSimpananSeluruhAnggota;
    uint256 public profitBelumDibagi;
    uint256 public totalSHUDibagikan;

    event AnggotaBaru(address indexed alamat, string nama, uint256 waktu);
    event DepositTercatat(address indexed user, uint256 jumlah, string jenis, uint256 waktu); // recordDeposit
    event PenarikanTercatat(address indexed user, uint256 jumlah, uint256 waktu);
    
    event PinjamanDiajukan(uint256 id, address peminjam, uint256 jumlah, uint256 tenor);
    event PinjamanDisetujui(uint256 id, address peminjam, uint256 jatuhTempo);
    event PinjamanDitolak(uint256 id, address peminjam, string alasan);
    event AngsuranMasuk(uint256 id, address peminjam, uint256 jumlah);
    event PinjamanLunas(uint256 id, address peminjam, uint256 waktu);
    event DendaDiterapkan(uint256 id, uint256 jumlahDenda);
    
    event ConfigUpdated(string jenis, uint256 nilaiBaru);

    modifier hanyaPengurus() {
        require(isPengurus[msg.sender] || msg.sender == owner(), "Hanya Admin/Pengurus");
        _;
    }

    modifier hanyaAnggota() {
        require(dataAnggota[msg.sender].terdaftar, "Belum terdaftar anggota");
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
        require(_permil <= 10, "Max 1% per hari"); // Safety cap
        dendaHarianPermil = _permil;
        emit ConfigUpdated("DendaHarian", _permil);
    }

    function tambahPengurus(address _admin) external onlyOwner {
        isPengurus[_admin] = true;
    }

    function registerMember(address _user, string memory _nama, string memory _ktpHash) external hanyaPengurus {
        require(!dataAnggota[_user].terdaftar, "User sudah terdaftar");

        dataAnggota[_user] = Anggota({
            terdaftar: true,
            nama: _nama,
            ktpHash: _ktpHash,
            simpananWajib: 0,
            simpananSukarela: 0,
            shuSudahDiambil: 0
        });

        listAlamatAnggota.push(_user);
        jumlahAnggota++;

        emit AnggotaBaru(_user, _nama, block.timestamp);
    }

    function recordDeposit(address _user, uint256 _amount, bool _isWajib) external hanyaPengurus {
        require(dataAnggota[_user].terdaftar, "User tidak dikenal/belum KYC");

        idrToken.mint(_user, _amount);
        
        if (_isWajib) {
            dataAnggota[_user].simpananWajib += _amount;
        } else {
            dataAnggota[_user].simpananSukarela += _amount;
        }
        totalSimpananSeluruhAnggota += _amount;

        emit DepositTercatat(_user, _amount, _isWajib ? "Wajib" : "Sukarela", block.timestamp);
    }

    function recordWithdrawal(address _user, uint256 _amount) external hanyaPengurus {
        require(dataAnggota[_user].simpananSukarela >= _amount, "Saldo sukarela kurang");
        
        idrToken.burn(_user, _amount);

        dataAnggota[_user].simpananSukarela -= _amount;
        totalSimpananSeluruhAnggota -= _amount;

        emit PenarikanTercatat(_user, _amount, block.timestamp);
    }

    function ajukanPinjaman(uint256 _amount, uint256 _tenorBulan) external hanyaAnggota {
        require(idPinjamanAktifAnggota[msg.sender] == 0, "Ada pinjaman aktif");
        
        uint256 maxLoan = _getTotalSimpanan(msg.sender) * 3;
        require(_amount <= maxLoan, "Over limit (Max 3x Simpanan)");

        idPinjamanTerakhir++;
        
        // Hitung Bunga (Flat per Tahun dibagi 12 bulan)
        // Rumus: (Pokok * Bunga%Tahun * (Tenor/12)) / 100
        // Simplifikasi: (Pokok * (Bunga%Tahun / 12) * Tenor) / 100
        uint256 bungaTotal = (_amount * bungaPinjamanTahunanPersen * _tenorBulan) / 1200;

        dataPinjaman[idPinjamanTerakhir] = Pinjaman({
            id: idPinjamanTerakhir,
            peminjam: msg.sender,
            jumlahPinjaman: _amount,
            totalHarusDibayar: _amount + bungaTotal,
            sudahDibayar: 0,
            tenorBulan: _tenorBulan,
            waktuJatuhTempo: 0, // Diset saat approve
            status: StatusPinjaman.Pending
        });

        idPinjamanAktifAnggota[msg.sender] = idPinjamanTerakhir;

        emit PinjamanDiajukan(idPinjamanTerakhir, msg.sender, _amount, _tenorBulan);
    }

    function setujuiPinjaman(uint256 _loanId) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Pending, "Status invalid");

        p.status = StatusPinjaman.Aktif;
        p.waktuJatuhTempo = block.timestamp + (p.tenorBulan * 30 days);
        
        loanBalance[p.peminjam] += p.totalHarusDibayar;

        emit PinjamanDisetujui(_loanId, p.peminjam, p.waktuJatuhTempo);
    }

    function tolakPinjaman(uint256 _loanId, string memory _alasan) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Pending, "Status invalid");

        p.status = StatusPinjaman.Ditolak;
        idPinjamanAktifAnggota[p.peminjam] = 0; 
        emit PinjamanDitolak(_loanId, p.peminjam, _alasan);
    }

    function recordAngsuran(uint256 _loanId, uint256 _amount) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Aktif, "Pinjaman tidak aktif");

        if (block.timestamp > p.waktuJatuhTempo) {
             uint256 overdueDays = (block.timestamp - p.waktuJatuhTempo) / 1 days;
             if(overdueDays > 0) {
            
                 uint256 sisa = p.totalHarusDibayar - p.sudahDibayar;
                 uint256 denda = (sisa * dendaHarianPermil * overdueDays) / 1000;
                 
                 p.totalHarusDibayar += denda;
                 p.waktuJatuhTempo = block.timestamp;
                 
                 emit DendaDiterapkan(_loanId, denda);
             }
        }

        p.sudahDibayar += _amount;
        if(loanBalance[p.peminjam] >= _amount) {
            loanBalance[p.peminjam] -= _amount; 
        } else {
            loanBalance[p.peminjam] = 0;
        }

        if (p.sudahDibayar >= p.totalHarusDibayar) {
            p.status = StatusPinjaman.Lunas;
            idPinjamanAktifAnggota[p.peminjam] = 0;
            
            uint256 bungaMurni = (p.totalHarusDibayar > p.jumlahPinjaman) ? (p.totalHarusDibayar - p.jumlahPinjaman) : 0;
            profitBelumDibagi += bungaMurni;

            emit PinjamanLunas(_loanId, p.peminjam, block.timestamp);
        }

        emit AngsuranMasuk(_loanId, p.peminjam, _amount);
    }

    function _getTotalSimpanan(address _user) internal view returns (uint256) {
        return idrToken.balanceOf(_user);
    }
}
