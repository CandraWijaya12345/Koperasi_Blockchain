// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import "@openzeppelin/contracts/token/ERC721/IERC721.sol"; 

// ==========================================
// KONTRAK KOPERASI (VERSI JAMINAN / COLLATERAL)
// ==========================================
// Fitur Unik: Pinjaman harus menyertakan aset NFT sebagai jaminan
contract KoperasiCollateral is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public idrToken;
    mapping(address => bool) public isPengurus;

    enum StatusPinjaman { Pending, Aktif, Lunas, Ditolak, Macet }

    struct Jaminan {
        address tokenAddress; // Alamat kontrak NFT (Surat Tanah Digital)
        uint256 tokenId;      // ID NFT
        bool isActive;
    }

    struct Pinjaman {
        uint256 id;
        address peminjam;
        uint256 jumlahPinjaman;          
        uint256 jumlahHarusDikembalikan; 
        uint256 sudahDibayar;
        uint256 tenorBulan;              
        uint256 waktuJatuhTempo;         
        StatusPinjaman status; 
        Jaminan jaminan; // [BARU] Data Jaminan
    }

    mapping(uint256 => Pinjaman) public dataPinjaman;
    mapping(address => uint256) public idPinjamanAktifAnggota;
    
    uint256 public idPinjamanTerakhir;
    uint256 public sukuBungaBulanPersen = 2; 

    // Events
    event PinjamanDenganJaminanDiajukan(uint256 id, address peminjam, address tokenCollateral, uint256 tokenId);
    event JaminanDisita(uint256 id, address tokenCollateral, uint256 tokenId);
    event JaminanDikembalikan(uint256 id, address tokenCollateral, uint256 tokenId);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        idrToken = IERC20(_tokenAddress);
        isPengurus[msg.sender] = true;
    }

    function tambahPengurus(address _calon) external onlyOwner {
        isPengurus[_calon] = true;
    }

    // ==========================================
    // PINJAMAN DENGAN JAMINAN (COLLATERAL)
    // ==========================================

    function ajukanPinjamanDenganJaminan(
        uint256 _jumlah, 
        uint256 _tenor,
        address _collateralToken,
        uint256 _tokenId
    ) external nonReentrant {
        require(idPinjamanAktifAnggota[msg.sender] == 0, "Ada pinjaman aktif");
        
        // Transfer Jaminan (NFT) dari User ke Kontrak Koperasi
        // User harus 'Approve' dulu di UI
        IERC721(_collateralToken).transferFrom(msg.sender, address(this), _tokenId);

        idPinjamanTerakhir++;
        uint256 bunga = (_jumlah * sukuBungaBulanPersen * _tenor) / 100;
        
        dataPinjaman[idPinjamanTerakhir] = Pinjaman({
            id: idPinjamanTerakhir,
            peminjam: msg.sender,
            jumlahPinjaman: _jumlah,
            jumlahHarusDikembalikan: _jumlah + bunga,
            sudahDibayar: 0,
            tenorBulan: _tenor,
            waktuJatuhTempo: 0, 
            status: StatusPinjaman.Pending,
            jaminan: Jaminan({
                tokenAddress: _collateralToken,
                tokenId: _tokenId,
                isActive: true
            })
        });

        idPinjamanAktifAnggota[msg.sender] = idPinjamanTerakhir;
        emit PinjamanDenganJaminanDiajukan(idPinjamanTerakhir, msg.sender, _collateralToken, _tokenId);
    }
    
    // Fungsi Setujui, Bayar, Sita (Disederhanakan untuk Demo)
    function setujuiPinjaman(uint256 _id) external {
        require(isPengurus[msg.sender], "Hanya pengurus");
        Pinjaman storage p = dataPinjaman[_id];
        require(p.status == StatusPinjaman.Pending, "Bukan pending");
        
        p.status = StatusPinjaman.Aktif;
        p.waktuJatuhTempo = block.timestamp + (p.tenorBulan * 30 days);
        
        idrToken.safeTransfer(p.peminjam, p.jumlahPinjaman);
    }

    function sitaJaminan(uint256 _id) external {
        require(isPengurus[msg.sender], "Hanya pengurus");
        Pinjaman storage p = dataPinjaman[_id];
        require(p.status == StatusPinjaman.Aktif, "Tidak aktif");
        
        // Anggap macet
        p.status = StatusPinjaman.Macet;
        
        // Pindahkan NFT ke Pengurus
        IERC721(p.jaminan.tokenAddress).transferFrom(address(this), msg.sender, p.jaminan.tokenId);
        emit JaminanDisita(_id, p.jaminan.tokenAddress, p.jaminan.tokenId);
    }
}
