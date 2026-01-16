// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ==========================================
// 1. KONTRAK TOKEN
// ==========================================
contract IDRToken is ERC20, Ownable {
    constructor() ERC20("Rupiah Token", "IDRT") Ownable(msg.sender) {}
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

// ==========================================
// 2. KONTRAK KOPERASI (Versi Final & Lengkap)
// ==========================================
contract KoperasiSimpanPinjam is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public idrToken;
    mapping(address => bool) public isPengurus;

    // [UPDATE] Enum untuk status yang lebih jelas
    enum StatusPinjaman { Pending, Aktif, Lunas, Ditolak }

    struct Anggota {
        bool terdaftar;
        string nama;
        uint256 simpananPokok;
        uint256 simpananWajib;
        uint256 simpananSukarela;
        uint256 shuSudahDiambil;
    }

    struct Pinjaman {
        uint256 id;
        address peminjam;
        uint256 jumlahPinjaman;          
        uint256 jumlahHarusDikembalikan; 
        uint256 sudahDibayar;
        uint256 tenorBulan;              
        uint256 waktuJatuhTempo;         
        uint256 bungaPersenSaatIni;      
        uint256 terakhirDendaDiupdate;   
        StatusPinjaman status; // [UPDATE] Mengganti bool lunas/disetujui
    }

    mapping(address => Anggota) public dataAnggota;
    mapping(uint256 => Pinjaman) public dataPinjaman;
    mapping(address => uint256) public idPinjamanAktifAnggota;
    address[] public listAlamatAnggota;
    
    uint256 public idPinjamanTerakhir;
    uint256 public jumlahAnggota;
    
    uint256 public constant SIMPANAN_POKOK = 100000 * (10 ** 18); 
    uint256 public constant SIMPANAN_WAJIB = 25000 * (10 ** 18);  
    
    // Variabel ini sekarang bisa diubah oleh Admin
    uint256 public sukuBungaBulanPersen = 2; 
    uint256 public dendaHarianPermil = 5; 

    // SHU Variables
    uint256 public totalSimpananSeluruhAnggota;
    uint256 public profitBelumDibagi;
    uint256 public totalSHUDibagikan;
    uint256 public totalSHUDiclaim;

    // Events
    event AnggotaBaru(address indexed alamat, string nama, uint256 waktu);
    event SimpananMasuk(address indexed dari, uint256 jumlah, string jenisSimpanan, uint256 waktu);
    event PenarikanSukses(address indexed oleh, uint256 jumlah, uint256 waktu);
    event PinjamanDiajukan(uint256 id, address peminjam, uint256 jumlah, uint256 tenor);
    event PinjamanDisetujui(uint256 id, address peminjam, uint256 jatuhTempo);
    event PinjamanDitolak(uint256 id, address peminjam, uint256 waktu); // [BARU]
    event AngsuranDibayar(uint256 id, address peminjam, uint256 jumlah);
    event PinjamanLunas(uint256 id, address peminjam, uint256 waktu);
    event DendaDiterapkan(uint256 id, uint256 jumlah, uint256 hari);
    event AnggotaKeluar(address alamat, uint256 totalDana, uint256 waktu);
    event ProfitMasuk(uint256 jumlah, string sumber);
    event SHUDidistribusikan(uint256 totalSHUBaru, uint256 waktu);
    event SHUDiclaim(address indexed anggota, uint256 jumlah);
    event ConfigUpdated(string jenis, uint256 nilaiBaru); // [BARU]
    event LikuiditasDitambah(address admin, uint256 jumlah); // [BARU]

    modifier hanyaPengurus() {
        require(isPengurus[msg.sender] || msg.sender == owner(), "Hanya pengurus");
        _;
    }

    modifier hanyaAnggota() {
        require(dataAnggota[msg.sender].terdaftar, "Bukan anggota");
        _;
    }

    constructor(address _tokenAddress) Ownable(msg.sender) {
        require(_tokenAddress != address(0), "Address token invalid");
        isPengurus[msg.sender] = true;
        idrToken = IERC20(_tokenAddress);
    }

    // ==========================================
    // [BARU] 1. UPDATE KONFIGURASI (ADMIN)
    // ==========================================
    
    function tambahPengurus(address _calon) external onlyOwner {
        isPengurus[_calon] = true;
    }

    function setSukuBunga(uint256 _persen) external hanyaPengurus {
        sukuBungaBulanPersen = _persen;
        emit ConfigUpdated("SukuBunga", _persen);
    }

    function setDendaHarian(uint256 _permil) external hanyaPengurus {
        dendaHarianPermil = _permil;
        emit ConfigUpdated("DendaPermil", _permil);
    }

    // ==========================================
    // [BARU] 2. EMERGENCY & FUNDING (ADMIN)
    // ==========================================

    // Admin menambah modal koperasi agar bisa mencairkan pinjaman
    function tambahLikuiditas(uint256 _amount) external onlyOwner {
        idrToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit LikuiditasDitambah(msg.sender, _amount);
    }

    // Penyelamatan dana darurat jika ada error (Hanya Owner)
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }

    // ==========================================
    // KEANGGOTAAN
    // ==========================================

    function daftarAnggota(string memory _nama) external nonReentrant {
        require(!dataAnggota[msg.sender].terdaftar, "Sudah terdaftar");
        
        idrToken.safeTransferFrom(msg.sender, address(this), SIMPANAN_POKOK);

        dataAnggota[msg.sender] = Anggota({
            terdaftar: true,
            nama: _nama,
            simpananPokok: SIMPANAN_POKOK,
            simpananWajib: 0,
            simpananSukarela: 0,
            shuSudahDiambil: 0
        });
        
        jumlahAnggota++;
        listAlamatAnggota.push(msg.sender);
        totalSimpananSeluruhAnggota += SIMPANAN_POKOK;

        emit AnggotaBaru(msg.sender, _nama, block.timestamp);
    }

    function setorSimpananWajib() external hanyaAnggota nonReentrant {
        idrToken.safeTransferFrom(msg.sender, address(this), SIMPANAN_WAJIB);
        dataAnggota[msg.sender].simpananWajib += SIMPANAN_WAJIB;
        totalSimpananSeluruhAnggota += SIMPANAN_WAJIB;
        emit SimpananMasuk(msg.sender, SIMPANAN_WAJIB, "Wajib", block.timestamp);
    }

    function setorSimpananSukarela(uint256 _jumlah) external hanyaAnggota nonReentrant {
        require(_jumlah > 0, "Jumlah 0");
        idrToken.safeTransferFrom(msg.sender, address(this), _jumlah);
        dataAnggota[msg.sender].simpananSukarela += _jumlah;
        totalSimpananSeluruhAnggota += _jumlah;
        emit SimpananMasuk(msg.sender, _jumlah, "Sukarela", block.timestamp);
    }

    function tarikSimpananSukarela(uint256 _jumlah) external hanyaAnggota nonReentrant {
        require(dataAnggota[msg.sender].simpananSukarela >= _jumlah, "Saldo kurang");
        require(idrToken.balanceOf(address(this)) >= _jumlah, "Kas kurang");
        
        _claimSHU(msg.sender);

        dataAnggota[msg.sender].simpananSukarela -= _jumlah;
        totalSimpananSeluruhAnggota -= _jumlah;
        
        idrToken.safeTransfer(msg.sender, _jumlah);
        emit PenarikanSukses(msg.sender, _jumlah, block.timestamp);
    }

    // ==========================================
    // PINJAMAN (DENGAN STATUS ENUM)
    // ==========================================

    function ajukanPinjaman(uint256 _jumlah, uint256 _tenor) external hanyaAnggota {
        // [UPDATE] Mengunci user agar tidak bisa spam pengajuan (1 user 1 proses)
        require(idPinjamanAktifAnggota[msg.sender] == 0, "Ada pinjaman aktif/pending");
        
        uint256 totalSimpanan = _getTotalSimpanan(msg.sender);
        require(_jumlah <= totalSimpanan * 3, "Over limit");

        idPinjamanTerakhir++;
        uint256 bunga = (_jumlah * sukuBungaBulanPersen * _tenor) / 100;
        
        // [UPDATE] Set ID Pinjaman Aktif di awal (Pending)
        idPinjamanAktifAnggota[msg.sender] = idPinjamanTerakhir;

        dataPinjaman[idPinjamanTerakhir] = Pinjaman({
            id: idPinjamanTerakhir,
            peminjam: msg.sender,
            jumlahPinjaman: _jumlah,
            jumlahHarusDikembalikan: _jumlah + bunga,
            sudahDibayar: 0,
            tenorBulan: _tenor,
            waktuJatuhTempo: 0, // Akan diset saat disetujui
            bungaPersenSaatIni: sukuBungaBulanPersen,
            terakhirDendaDiupdate: 0,
            status: StatusPinjaman.Pending // [BARU] Status Pending
        });
        emit PinjamanDiajukan(idPinjamanTerakhir, msg.sender, _jumlah, _tenor);
    }

    function setujuiPinjaman(uint256 _id) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_id];
        require(p.status == StatusPinjaman.Pending, "Status bukan pending");
        require(idrToken.balanceOf(address(this)) >= p.jumlahPinjaman, "Kas kurang");
        
        p.status = StatusPinjaman.Aktif; // [BARU] Ubah ke Aktif
        p.waktuJatuhTempo = block.timestamp + (p.tenorBulan * 30 days);
        p.terakhirDendaDiupdate = p.waktuJatuhTempo;
        
        idrToken.safeTransfer(p.peminjam, p.jumlahPinjaman);
        emit PinjamanDisetujui(_id, p.peminjam, p.waktuJatuhTempo);
    }

    // [BARU] Fitur Tolak Pinjaman
    function tolakPinjaman(uint256 _id) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_id];
        require(p.status == StatusPinjaman.Pending, "Hanya bisa tolak pending");
        
        p.status = StatusPinjaman.Ditolak;
        
        // Lepas kunci agar user bisa mengajukan lagi
        idPinjamanAktifAnggota[p.peminjam] = 0; 

        emit PinjamanDitolak(_id, p.peminjam, block.timestamp);
    }

    function bayarAngsuran(uint256 _id, uint256 _jumlah) external hanyaAnggota nonReentrant {
        Pinjaman storage p = dataPinjaman[_id];
        require(p.peminjam == msg.sender, "Bukan milik anda");
        require(p.status == StatusPinjaman.Aktif, "Pinjaman tidak aktif"); // [BARU] Cek Enum

        // Logika Denda
        if (block.timestamp > p.waktuJatuhTempo) {
            uint256 start = p.terakhirDendaDiupdate > p.waktuJatuhTempo ? p.terakhirDendaDiupdate : p.waktuJatuhTempo;
            uint256 hari = (block.timestamp - start) / 1 days;
            
            if (hari > 0) {
                uint256 sisa = p.jumlahHarusDikembalikan - p.sudahDibayar;
                uint256 denda = (sisa * dendaHarianPermil * hari) / 1000;
                
                p.jumlahHarusDikembalikan += denda;
                p.terakhirDendaDiupdate = block.timestamp;
                profitBelumDibagi += denda; 
                emit ProfitMasuk(denda, "Denda");
                emit DendaDiterapkan(_id, denda, hari);
            }
        }

        idrToken.safeTransferFrom(msg.sender, address(this), _jumlah);
        p.sudahDibayar += _jumlah;
        
        if (p.sudahDibayar >= p.jumlahHarusDikembalikan) {
            p.status = StatusPinjaman.Lunas; // [BARU] Ubah ke Lunas
            idPinjamanAktifAnggota[msg.sender] = 0;
            
            uint256 totalBungaMurni = (p.jumlahPinjaman * p.bungaPersenSaatIni * p.tenorBulan) / 100;
            profitBelumDibagi += totalBungaMurni;
            emit ProfitMasuk(totalBungaMurni, "Bunga");

            uint256 sisa = p.sudahDibayar - p.jumlahHarusDikembalikan;
            if(sisa > 0) {
                idrToken.safeTransfer(msg.sender, sisa);
            }
            emit PinjamanLunas(_id, msg.sender, block.timestamp);
        } else {
            emit AngsuranDibayar(_id, msg.sender, _jumlah);
        }
    }

    // ==========================================
    // SHU & KELUAR
    // ==========================================

    function bagikanSHU() external hanyaPengurus {
        require(profitBelumDibagi > 0, "Belum ada profit");
        require(totalSimpananSeluruhAnggota > 0, "Belum ada simpanan");

        totalSHUDibagikan += profitBelumDibagi;
        emit SHUDidistribusikan(profitBelumDibagi, block.timestamp);
        profitBelumDibagi = 0;
    }

    function claimSHU() external nonReentrant hanyaAnggota {
        _claimSHU(msg.sender);
    }

    function _claimSHU(address _user) internal {
        uint256 userShare = _getTotalSimpanan(_user);
        if (userShare == 0 || totalSimpananSeluruhAnggota == 0) return;
        
        uint256 kepemilikan = (userShare * 1e18) / totalSimpananSeluruhAnggota;
        uint256 hakTotal = (kepemilikan * totalSHUDibagikan) / 1e18;
        
        uint256 shuBolehAmbil = 0;
        if (hakTotal > dataAnggota[_user].shuSudahDiambil) {
            shuBolehAmbil = hakTotal - dataAnggota[_user].shuSudahDiambil;
        }

        if (shuBolehAmbil > 0) {
            require(idrToken.balanceOf(address(this)) >= shuBolehAmbil, "Kas kurang");
            dataAnggota[_user].shuSudahDiambil += shuBolehAmbil;
            totalSHUDiclaim += shuBolehAmbil;
            idrToken.safeTransfer(_user, shuBolehAmbil);
            emit SHUDiclaim(_user, shuBolehAmbil);
        }
    }

    function keluarAnggota() external hanyaAnggota nonReentrant {
        require(idPinjamanAktifAnggota[msg.sender] == 0, "Lunasi pinjaman dulu");
        
        _claimSHU(msg.sender);

        Anggota storage a = dataAnggota[msg.sender];
        uint256 total = a.simpananPokok + a.simpananWajib + a.simpananSukarela;
        
        if (totalSimpananSeluruhAnggota >= total) {
            totalSimpananSeluruhAnggota -= total;
        } else {
            totalSimpananSeluruhAnggota = 0;
        }

        a.simpananPokok = 0;
        a.simpananWajib = 0;
        a.simpananSukarela = 0;
        a.terdaftar = false;
        
        jumlahAnggota--;
        _hapusDariList(msg.sender);

        if (total > 0) {
            idrToken.safeTransfer(msg.sender, total);
        }
        emit AnggotaKeluar(msg.sender, total, block.timestamp);
    }

    // ==========================================
    // VIEW & UTILS
    // ==========================================

    function _getTotalSimpanan(address _user) internal view returns (uint256) {
        return dataAnggota[_user].simpananPokok + dataAnggota[_user].simpananWajib + dataAnggota[_user].simpananSukarela;
    }
    
    function cekSHUSaya() external view returns (uint256) {
         uint256 userShare = _getTotalSimpanan(msg.sender);
         if (userShare == 0 || totalSimpananSeluruhAnggota == 0) return 0;
         
         uint256 kepemilikan = (userShare * 1e18) / totalSimpananSeluruhAnggota;
         uint256 hakTotal = (kepemilikan * totalSHUDibagikan) / 1e18;
         
         if (hakTotal > dataAnggota[msg.sender].shuSudahDiambil) {
            return hakTotal - dataAnggota[msg.sender].shuSudahDiambil;
         }
         return 0;
    }

    function getListAnggota() external view returns (address[] memory) {
        return listAlamatAnggota;
    }

    function _hapusDariList(address _addr) internal {
        for (uint256 i = 0; i < listAlamatAnggota.length; i++) {
            if (listAlamatAnggota[i] == _addr) {
                listAlamatAnggota[i] = listAlamatAnggota[listAlamatAnggota.length - 1];
                listAlamatAnggota.pop();
                break;
            }
        }
    }
}
