const axios = require('axios');
const FormData = require('form-data');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

/**
 * Mengunggah JSON (Data Identitas) ke IPFS via Pinata
 */
const uploadJSONToIPFS = async (jsonData, customName, groupId = null) => {
    try {
        const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
        const body = {
            pinataContent: jsonData,
            pinataMetadata: {
                name: customName || `Member_Identity_${Date.now()}.json`
            }
        };
        if (groupId) {
            body.pinataOptions = { groupId };
        }
        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_API_SECRET
            }
        });
        return response.data.IpfsHash;
    } catch (error) {
        console.error("IPFS JSON Upload Error:", error.response ? error.response.data : error.message);
        throw new Error("Gagal mengunggah data identitas ke IPFS");
    }
};

/**
 * Mengunggah File (Foto KTP) ke IPFS via Pinata
 */
const uploadFileToIPFS = async (fileBuffer, fileName, groupId = null) => {
    try {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        let data = new FormData();
        data.append('file', fileBuffer, fileName);

        if (groupId) {
            data.append('pinataOptions', JSON.stringify({ groupId }));
        }

        const response = await axios.post(url, data, {
            maxBodyLength: 'Infinity',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_API_SECRET
            }
        });
        return response.data.IpfsHash;
    } catch (error) {
        console.error("IPFS File Upload Error:", error.response ? error.response.data : error.message);
        throw new Error("Gagal mengunggah foto ke IPFS");
    }
};

/**
 * Mengunggah Multiple Files ke IPFS dengan struktur folder via Pinata
 * @param {Array<{buffer: Buffer, filepath: string}>} filesList 
 */
const uploadDirectoryToIPFS = async (filesList, groupId = null) => {
    try {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        let data = new FormData();
        
        for (const file of filesList) {
            data.append('file', file.buffer, {
                filepath: file.filepath
            });
        }

        if (groupId) {
            data.append('pinataOptions', JSON.stringify({ groupId }));
        }

        const response = await axios.post(url, data, {
            maxBodyLength: 'Infinity',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_API_SECRET
            }
        });
        return response.data.IpfsHash;
    } catch (error) {
        console.error("IPFS Directory Upload Error:", error.response ? error.response.data : error.message);
        throw new Error("Gagal mengunggah struktur folder ke IPFS");
    }
};

module.exports = { uploadJSONToIPFS, uploadFileToIPFS, uploadDirectoryToIPFS };
