import React, { useState } from 'react';
import axios from 'axios';
import SignOut from './Signout';

function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [totalPages, setTotalPages] = useState(null);
  const [pagesToRemove, setPagesToRemove] = useState([]);
  const [sourceIndex, setSourceIndex] = useState('');
  const [targetIndex, setTargetIndex] = useState('');
  const [message, setMessage] = useState('');
  
  // Function to retrieve the authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token'); // Assuming token is stored in localStorage
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a PDF file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${getAuthToken()}` // Add auth token to header
        }
      });
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const downloadPDF = async () => {
    try {
      if (pagesToRemove.length === totalPages) {
        alert('Deleting all pages will result in a blank file.');
        return;
      }
  
      const response = await axios.post(`http://localhost:5000/download/${selectedFile.name}`, { pagesToRemove }, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}` // Add auth token to header
        }
      });
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', selectedFile.name);
  
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handlePageToggle = (pageNumber) => {
    if (pagesToRemove.includes(pageNumber)) {
      setPagesToRemove(pagesToRemove.filter((page) => page !== pageNumber));
    } else {
      setPagesToRemove([...pagesToRemove, pageNumber]);
    }
  };

  const rearragePages = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post('http://localhost:5000/movePage', {
        sourceIndex: parseInt(sourceIndex),
        targetIndex: parseInt(targetIndex),
        pdfFile: selectedFile.name
      },{
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}` // Add auth token to header
        }
      });
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', selectedFile.name);
  
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setMessage('Error: Internal server error');
      console.error(error)
    }
  };

  return (
    <div>
      <h1>PDF Upload and Download</h1>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      {totalPages && <p>Total Pages: {totalPages}</p>}

      {totalPages && (
        <>
          <p>Pages to delete</p>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <label key={pageNumber}>
              <input
                type="checkbox"
                checked={pagesToRemove.includes(pageNumber)}
                onChange={() => handlePageToggle(pageNumber)}
              />
              Page {pageNumber}
            </label>
          ))}
          <button onClick={downloadPDF}>Download Modified PDF</button>

          <div>
            <h2>Move Page</h2>
            <form onSubmit={rearragePages}>
              <div>
                <label>Source Index:</label>
                <input
                  type="number"
                  value={sourceIndex}
                  onChange={(e) => setSourceIndex(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Target Index:</label>
                <input
                  type="number"
                  value={targetIndex}
                  onChange={(e) => setTargetIndex(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>PDF Path:</label>
                <input
                  type="text"
                  value={selectedFile.name}
                />
              </div>
              <button type="submit">Move Page</button>
            </form>
            {message && <p>{message}</p>}
          </div>
        </>
      )}
      <SignOut/>
    </div>
  );
}

export default Home;
