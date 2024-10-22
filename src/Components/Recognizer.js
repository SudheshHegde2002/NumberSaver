import FileBase64 from 'react-file-base64';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { Container, Card, CardContent, Typography, Button } from '@mui/material';
import React, { useState } from 'react';
import './Recognizer.css'; 
const Recognizer = () =>{
    const [imageData, setImageData] = useState(null);
    const [recognizedText, setRecognizedText] = useState('');
    const [vcfFile, setVcfFile] = useState(null);
    const api_key = process.env.REACT_APP_AZURE_KEY;
    const azure_endpoint = process.env.REACT_APP_AZ_ENDPOINT;
    const handleFileUpload = (file) => {
      setImageData(file.base64);
    };
  
    const recognizeText = async () => {
      if (!imageData) {
        alert("Please upload an image first.");
        return;
      }
  
      try {
        const subscriptionKey = api_key;
        const endpoint ="https://numext.cognitiveservices.azure.com/";
  
        const cognitiveServiceCredentials = new ApiKeyCredentials({
          inHeader: { 'Ocp-Apim-Subscription-Key': subscriptionKey }
        });
  
        const client = new ComputerVisionClient(cognitiveServiceCredentials, endpoint);
  
        const imageBlob = await fetch(imageData).then((res) => res.blob());
  
        const results = await client.readInStream(imageBlob);
        const operationId = results.operationLocation.split('/').slice(-1)[0];
  
        let status = 'running';
        while (status === 'running' || status === 'notStarted') {
          const result = await client.getReadResult(operationId);
          status = result.status;
          if (status === 'succeeded') {
            const lines = result.analyzeResult.readResults
              .flatMap((page) => page.lines)
              .map((line) => line.text);
            const text = lines.join('\n');
            setRecognizedText(text);
            extractPhoneNumbers(text);
          }
        }
      } catch (error) {
        console.error("Error recognizing text:", error);
      }
    };
  
    const extractPhoneNumbers = (text) => {
      const phoneNumberPattern = /\b\d{10}\b/g; 
      const phoneNumbers = text.match(phoneNumberPattern) || [];
  
      if (phoneNumbers.length > 0) {
        generateVcfFile(phoneNumbers);
      } else {
        alert("No phone numbers found in the text.");
      }
    };
  
    const generateVcfFile = (phoneNumbers) => {
      const vcfContent = phoneNumbers
        .map((number, index) => `BEGIN:VCARD\nVERSION:3.0\nFN:Contact ${index + 1}\nTEL:${number}\nEND:VCARD`)
        .join('\n');
      const blob = new Blob([vcfContent], { type: 'text/vcard' });
      const vcfUrl = URL.createObjectURL(blob);
      setVcfFile(vcfUrl);
    };
    return (
      <Container maxWidth="sm" style={{ marginTop: '50px' }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" component="h2" align="center">
              Upload an Image to Extract Handwritten Phone Numbers
            </Typography>
            <FileBase64
              multiple={false}
              onDone={handleFileUpload}
            />
            {imageData && (
              <img src={imageData} alt="Uploaded" style={{ marginTop: '20px', maxWidth: '100%', borderRadius: '8px' }} />
            )}
            <Button 
              variant="contained" 
              color="success" 
              onClick={recognizeText} 
              style={{ marginTop: '20px', width: '100%' }}
            >
              Recognize Handwritten Text
            </Button>
            {recognizedText && (
              <div style={{ marginTop: '20px' }}>
                <Typography variant="h6">Recognized Text:</Typography>
                <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>{recognizedText}</pre>
              </div>
            )}
            {vcfFile && (
              <div style={{ marginTop: '20px' }}>
                <a href={vcfFile} download="contacts.vcf">
                  <Button variant="contained" color="primary" style={{ width: '100%' }}>
                    Download .vcf File
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    );
  };
  




export default Recognizer