import React from 'react';
import { Download, FileText, Printer, CheckCircle2, Circle } from 'lucide-react';
import { Modal, Button, Badge } from './ui';
import './ExportModal.css';

export function ExportModal({ isOpen, onClose, roadmapData }) {
  if (!roadmapData) return null;

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export the PDF.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${roadmapData.title} Roadmap - LearnWise Export</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Sora:wght@600;700;800&display=swap');
          
          body {
            font-family: 'DM Sans', sans-serif;
            color: #111827;
            background: #ffffff;
            margin: 0;
            padding: 40px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .brand {
            font-family: 'Sora', sans-serif;
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .brand-accent {
            color: #06b6d4;
          }
          .title {
            font-family: 'Sora', sans-serif;
            font-size: 32px;
            font-weight: 800;
            margin: 10px 0;
            color: #111827;
          }
          .stats {
            display: flex;
            justify-content: center;
            gap: 20px;
            font-size: 14px;
            color: #4b5563;
          }
          .stat-badge {
            background: #f3f4f6;
            padding: 5px 12px;
            border-radius: 100px;
            font-weight: 600;
          }
          .step-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .step-header {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            margin-bottom: 10px;
          }
          .step-checkbox {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: 2px solid #d1d5db;
            color: white;
            font-weight: bold;
          }
          .step-checkbox.completed {
            background: #10b981;
            border-color: #10b981;
          }
          .step-content {
            flex: 1;
          }
          .step-title-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 5px;
          }
          .step-title {
            font-family: 'Sora', sans-serif;
            font-size: 18px;
            font-weight: 700;
            margin: 0;
          }
          .category-tag {
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 4px;
            background: #e0e7ff;
            color: #4f46e5;
            font-weight: 700;
            text-transform: uppercase;
          }
          .step-desc {
            margin: 0;
            color: #4b5563;
            font-size: 15px;
          }
          .resources-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6b7280;
            margin: 15px 0 8px 0;
          }
          .resource-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .resource-item {
            font-size: 14px;
            margin-bottom: 5px;
          }
          .resource-link {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          @media print {
            body { padding: 0; }
            .step-card { border: 1px solid #d1d5db; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Learn<span class="brand-accent">Wise</span> AI</div>
          <h1 class="title">${roadmapData.title} Roadmap</h1>
          <div class="stats">
            <span class="stat-badge">${roadmapData.skill_level} Level</span>
            <span class="stat-badge">${roadmapData.completed_steps} of ${roadmapData.total_steps} Steps Completed</span>
            <span class="stat-badge">${roadmapData.progress_percentage}% Progress</span>
          </div>
        </div>

        <div class="roadmap-list">
          ${roadmapData.roadmap?.steps?.map(step => `
            <div class="step-card">
              <div class="step-header">
                <div class="step-checkbox ${step.is_completed ? 'completed' : ''}">
                  ${step.is_completed ? '✓' : ''}
                </div>
                <div class="step-content">
                  <div class="step-title-row">
                    <h3 class="step-title">${step.order_index}. ${step.title}</h3>
                    <span class="category-tag">${step.category || 'Core'}</span>
                  </div>
                  <p class="step-desc">${step.description}</p>
                  
                  ${step.resources && step.resources.length > 0 ? `
                    <div class="resources-title">Curated Resources</div>
                    <ul class="resource-list">
                      ${step.resources.map(res => `
                        <li class="resource-item">
                          • <a href="${res.url}" class="resource-link" target="_blank">${res.title}</a> 
                          <span style="color:#6b7280; font-size:12px;">(${res.resource_type || 'Link'})</span>
                        </li>
                      `).join('')}
                    </ul>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          Generated by LearnWise AI - Your Personal Learning Architect
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Roadmap">
      <div className="export-modal-content">
        <p className="export-desc">
          Generate a clean, print-ready PDF of your entire roadmap, including all steps, categories, and curated resource links.
        </p>

        <div className="export-preview">
          <div className="preview-header">
            <FileText size={18} className="preview-icon" />
            <span>Document Preview</span>
          </div>
          <div className="preview-body">
            <h4 className="preview-title">{roadmapData.title} Roadmap</h4>
            <div className="preview-stats">
              <Badge variant="neutral">{roadmapData.skill_level}</Badge>
              <Badge variant="success">{roadmapData.progress_percentage}% Complete</Badge>
            </div>
            <div className="preview-lines">
              <div className="preview-line w-full"></div>
              <div className="preview-line w-3/4"></div>
              <div className="preview-line w-5/6"></div>
            </div>
          </div>
        </div>

        <div className="export-actions">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon={Printer} onClick={handleExportPDF} className="export-btn">
            Generate & Print PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
