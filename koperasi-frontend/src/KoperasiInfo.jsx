// src/KoperasiInfo.jsx

import { useState, useEffect } from 'react';

function KoperasiInfo() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/info')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setInfo(data.data);
        }
      });
  }, []);

  if (!info) {
    return <p>Memuat data koperasi...</p>;
  }

  return (
    <div>
      <p>Total Anggota: {info.jumlah_anggota}</p>
      <p>Suku Bunga: {info.suku_bunga_persen}%</p>
    </div>
  );
}

export default KoperasiInfo;