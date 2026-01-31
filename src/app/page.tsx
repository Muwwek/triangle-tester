'use client';

import React, { useState } from 'react';

type TestMode = 'Bva' | 'Robustness' | 'Worse case' | 'Worse case Robustness';

interface TestCase {
  id: number;
  w: number;
  h: number;
}

export default function Home() {
  // --- 0. State Declaration ---
  const [testerName, setTesterName] = useState<string>('');
  
  // Input Ranges
  const [wMin, setWMin] = useState<number>(1);
  const [wMax, setWMax] = useState<number>(10);
  const [hMin, setHMin] = useState<number>(1);
  const [hMax, setHMax] = useState<number>(10);
  
  // Mode Selection
  const [mode, setMode] = useState<TestMode>('Bva');

  // Outputs
  const [logOutput, setLogOutput] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);

  // --- Logic Functions ---

  const getTestPoints = (min: number, max: number, selectedMode: TestMode) => {
    // คำนวณจุดพื้นฐาน
    const nom = Math.floor((min + max) / 2);
    
    // Basic BVA points: Min, Min+1, Nom, Max-1, Max
    const basicPoints = [min, min + 1, nom, max - 1, max];
    
    // Robustness points: Min-1, ..., Max+1
    const robustPoints = [min - 1, ...basicPoints, max + 1];

    let finalPoints: number[] = [];

    // เลือกชุดข้อมูลตาม Mode
    if (selectedMode === 'Bva' || selectedMode === 'Worse case') {
      finalPoints = basicPoints;
    } else {
      finalPoints = robustPoints;
    }

    // ลบค่าซ้ำ + เรียงลำดับ (Unique & Sort)
    finalPoints = Array.from(new Set(finalPoints)).sort((a, b) => a - b);

    return { points: finalPoints, nominal: nom };
  };

  const handleGenerate = () => {
    // 1. Prepare Data Points
    const wData = getTestPoints(Number(wMin), Number(wMax), mode);
    const hData = getTestPoints(Number(hMin), Number(hMax), mode);
    
    let testCases: { w: number; h: number; }[] = [];
    const wNom = wData.nominal;
    const hNom = hData.nominal;

    // 2. Generating Logic (Pairing)
    if (mode.includes('Worse case')) {
      // Worse Case: Cartesian Product (จับคู่ทุกตัว)
      wData.points.forEach(w => {
        hData.points.forEach(h => {
          testCases.push({ w, h });
        });
      });
    } else {
      // BVA / Robustness: Single Fault Assumption
      // 2.1 Fix W at Nom, Loop H
      hData.points.forEach(h => {
        testCases.push({ w: wNom, h });
      });
      // 2.2 Fix H at Nom, Loop W
      wData.points.forEach(w => {
        // Prevent duplicate center point (Nom, Nom)
        if (w !== wNom) {
          testCases.push({ w, h: hNom });
        }
      });
    }

    // 3. Assign sequential IDs to each test case
    const testCasesWithId: TestCase[] = testCases.map((tc, idx) => ({ id: idx + 1, ...tc }));
    
    // 4. Format Output String
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const timeStr = now.toLocaleTimeString('en-GB');
    
    let buffer = `Tester Name : ${testerName || 'Unknown'}\n`;
    buffer += `DateTime Generate : ${dateStr} ${timeStr}\n`;
    buffer += `Mode : ${mode}\n`;
    buffer += `-`.repeat(50) + `\n`;
    buffer += `Loop :\n`;
    // Table Header
    buffer += `${'ID'.padEnd(6)} ${'W'.padEnd(10)} ${'H'.padEnd(10)} ${'Area'.padEnd(15)}\n`; 

    // Use assigned IDs and compute area
    testCasesWithId.forEach((tc) => {
      const area = (tc.w * tc.h) / 2;
      
      const idStr = tc.id.toString().padEnd(6);
      const wStr = tc.w.toString().padEnd(10);
      const hStr = tc.h.toString().padEnd(10);
      const areaStr = area.toFixed(2).padEnd(15);
      
      buffer += `${idStr} ${wStr} ${hStr} ${areaStr}\n`;
    });

    const finishTime = new Date().toLocaleTimeString('en-GB');
    buffer += `-`.repeat(50) + `\n`;
    buffer += `DateTime finish : ${finishTime}\n`;
    buffer += `Total number of test case :> ${testCasesWithId.length}`; 

    // Update State
    setLogOutput(buffer);
    setTotalCount(testCasesWithId.length);
  };

  const downloadFile = () => {
    if (!logOutput) return;
    const element = document.createElement("a");
    const file = new Blob([logOutput], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "ExecuteLog.txt";
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  // --- JSX Rendering ---
  return (
    <main className="container">
      <h1>Triangle Test Generator</h1>

      {/* 0. Tester Name */}
      <div className="input-group">
        <label>0. Tester Name:</label>
        <input 
          className="input-field"
          type="text" 
          value={testerName}
          onChange={(e) => setTesterName(e.target.value)}
          placeholder="Enter Tester Name"
        />
      </div>

      {/* 1. W & H Ranges */}
      <div className="input-group">
        <label>1. Width Range (Min - Max):</label>
        <div className="input-row">
          <input 
            className="input-field" type="number" 
            value={wMin} onChange={(e) => setWMin(Number(e.target.value))} 
          />
          <input 
            className="input-field" type="number" 
            value={wMax} onChange={(e) => setWMax(Number(e.target.value))} 
          />
        </div>
      </div>

      <div className="input-group">
        <label>1. Height Range (Min - Max):</label>
        <div className="input-row">
          <input 
            className="input-field" type="number" 
            value={hMin} onChange={(e) => setHMin(Number(e.target.value))} 
          />
          <input 
            className="input-field" type="number" 
            value={hMax} onChange={(e) => setHMax(Number(e.target.value))} 
          />
        </div>
      </div>

      {/* 2. Mode Selection */}
      <div className="input-group">
        <label>2. Select Strategy:</label>
        <select 
          className="select-field" 
          value={mode} 
          onChange={(e) => setMode(e.target.value as TestMode)}
        >
          <option value="Bva">Boundary Value Analysis (BVA)</option>
          <option value="Robustness">Robustness</option>
          <option value="Worse case">Worse Case</option>
          <option value="Worse case Robustness">Worse Case Robustness</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="btn-group">
        <button className="btn btn-primary" onClick={handleGenerate}>
          Generate Log
        </button>
        {logOutput && (
          <button className="btn btn-success" onClick={downloadFile}>
            Download .txt
          </button>
        )}
      </div>

      {/* 4. Results */}
      {logOutput && (
        <div className="log-container">
          <h3>Execute Log:</h3>
          <pre className="log-pre">{logOutput}</pre>
          <div className="summary">Total Cases: {totalCount}</div>
        </div>
      )}
    </main>
  );
}