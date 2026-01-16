// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ==========================================
// KONTRAK KOPERASI (VERSI VOTING / DEMOKRATIS)
// ==========================================
// Fitur Unik: Perubahan Suku Bunga harus melalui Voting Anggota
contract KoperasiVoting is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public idrToken;
    mapping(address => bool) public isPengurus;

    // --- STRUKTUR VOTING ---
    struct Proposal {
        uint256 id;
        string description;     // e.g., "Naikkan bunga ke 5%"
        uint256 newSukuBunga;   // Nilai baru yang diajukan
        uint256 voteCount;      // Jumlah suara setuju
        uint256 endTime;        // Batas waktu voting
        bool executed;          // Apakah sudah dieksekusi
        address proposer;       // Pengaju proposal
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted; // proposalId => user => voted?
    uint256 public proposalCount;
    uint256 public constant VOTING_DURATION = 3 days; // Durasi voting

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
        StatusPinjaman status; 
    }

    mapping(address => Anggota) public dataAnggota;
    mapping(uint256 => Pinjaman) public dataPinjaman;
    mapping(address => uint256) public idPinjamanAktifAnggota;
    address[] public listAlamatAnggota;
    
    uint256 public idPinjamanTerakhir;
    uint256 public jumlahAnggota;
    
    uint256 public constant SIMPANAN_POKOK = 100000 * (10 ** 18); 
    uint256 public constant SIMPANAN_WAJIB = 25000 * (10 ** 18);  
    
    uint256 public sukuBungaBulanPersen = 2; // Default
    uint256 public dendaHarianPermil = 5; 

    uint256 public totalSimpananSeluruhAnggota;
    uint256 public profitBelumDibagi;
    uint256 public totalSHUDibagikan;
    uint256 public totalSHUDiclaim;

    event ProposalCreated(uint256 id, string desc, uint256 newRate, uint256 endTime);
    event Voted(uint256 proposalId, address voter);
    event ProposalExecuted(uint256 id, uint256 newRate);
    event ConfigUpdated(string jenis, uint256 nilaiBaru); 
    event AnggotaBaru(address indexed alamat, string nama, uint256 waktu);

    modifier hanyaPengurus() {
        require(isPengurus[msg.sender] || msg.sender == owner(), "Hanya pengurus");
        _;
    }

    modifier hanyaAnggota() {
        require(dataAnggota[msg.sender].terdaftar, "Bukan anggota");
        _;
    }

    constructor(address _tokenAddress) Ownable(msg.sender) {
        isPengurus[msg.sender] = true;
        idrToken = IERC20(_tokenAddress);
    }

    // Fungsi Pendaftaran Anggota (Standar)
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

    // ==========================================
    // LOGIKA VOTING (PENGGANTI setSukuBunga)
    // ==========================================

    // 1. Pengurus Mengajukan Proposal
    function ajukanProposalBunga(uint256 _newRate, string memory _desc) external hanyaPengurus {
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            description: _desc,
            newSukuBunga: _newRate,
            voteCount: 0,
            endTime: block.timestamp + VOTING_DURATION,
            executed: false,
            proposer: msg.sender
        });

        emit ProposalCreated(proposalCount, _desc, _newRate, block.timestamp + VOTING_DURATION);
    }

    // 2. Anggota Melakukan Voting
    function vote(uint256 _proposalId) external hanyaAnggota {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp < p.endTime, "Voting berakhir");
        require(!p.executed, "Sudah dieksekusi");
        require(!hasVoted[_proposalId][msg.sender], "Sudah vote");

        hasVoted[_proposalId][msg.sender] = true;
        p.voteCount++; // One person one vote
        
        emit Voted(_proposalId, msg.sender);
    }

    // 3. Eksekusi Hasil (Jika Quorum / Mayoritas tercapai)
    function eksekusiProposal(uint256 _proposalId) external hanyaPengurus {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp >= p.endTime, "Masa voting belum habis");
        require(!p.executed, "Sudah dieksekusi");

        // Syarat: Minimal 30% anggota setuju
        uint256 quorum = (jumlahAnggota * 30) / 100; 
        require(p.voteCount > quorum, "Suara tidak cukup");

        sukuBungaBulanPersen = p.newSukuBunga;
        p.executed = true;

        emit ConfigUpdated("SukuBunga (By Vote)", p.newSukuBunga);
        emit ProposalExecuted(_proposalId, p.newSukuBunga);
    }
}
