-- Add evidence for SAFE categories
INSERT INTO inspection_evidence (category_id, evidence_text) VALUES
-- Safeguarding (85291642-3962-4b70-b8db-30e71d64ac41)
('85291642-3962-4b70-b8db-30e71d64ac41', 'Safeguarding policy and procedures are in place and up to date'),
('85291642-3962-4b70-b8db-30e71d64ac41', 'Staff have received safeguarding training'),
('85291642-3962-4b70-b8db-30e71d64ac41', 'Safeguarding concerns are appropriately reported and escalated'),

-- Risk Management (655edb99-5cde-4387-acc1-27a18b92ee01)
('655edb99-5cde-4387-acc1-27a18b92ee01', 'Individual risk assessments are completed and regularly reviewed'),
('655edb99-5cde-4387-acc1-27a18b92ee01', 'Environmental risk assessments are in place'),
('655edb99-5cde-4387-acc1-27a18b92ee01', 'Risk management plans are person-centred'),

-- Staffing Levels (61ee9390-d99a-48e0-b475-d7913a58e241)
('61ee9390-d99a-48e0-b475-d7913a58e241', 'Staffing levels are sufficient to meet care needs'),
('61ee9390-d99a-48e0-b475-d7913a58e241', 'Staff deployment is flexible to respond to changing needs'),
('61ee9390-d99a-48e0-b475-d7913a58e241', 'Recruitment and retention strategies are effective'),

-- Medicines Management (50626840-336c-46ff-88ec-cc14e06b992f)
('50626840-336c-46ff-88ec-cc14e06b992f', 'Medicines are safely stored and administered'),
('50626840-336c-46ff-88ec-cc14e06b992f', 'Staff are competent in medicines administration'),
('50626840-336c-46ff-88ec-cc14e06b992f', 'Medicines records are accurate and complete'),

-- Infection Prevention and Control (8a33a50e-8b0f-4515-b8bb-c52337e47aab)
('8a33a50e-8b0f-4515-b8bb-c52337e47aab', 'Infection control policies are in place and followed'),
('8a33a50e-8b0f-4515-b8bb-c52337e47aab', 'Staff have access to PPE and use it appropriately'),
('8a33a50e-8b0f-4515-b8bb-c52337e47aab', 'Premises are clean and well-maintained'),

-- Incidents and Accidents (092591eb-42a2-40a2-b7d8-50d2e2323178)
('092591eb-42a2-40a2-b7d8-50d2e2323178', 'Incidents and accidents are recorded and investigated'),
('092591eb-42a2-40a2-b7d8-50d2e2323178', 'Learning from incidents is shared and acted upon'),
('092591eb-42a2-40a2-b7d8-50d2e2323178', 'Duty of candour is applied appropriately');

-- Add evidence for EFFECTIVE categories
INSERT INTO inspection_evidence (category_id, evidence_text) VALUES
-- Assessment and Care Planning (f563d1aa-baba-4e92-8ab5-d2ff27249c56)
('f563d1aa-baba-4e92-8ab5-d2ff27249c56', 'Pre-admission assessments are comprehensive'),
('f563d1aa-baba-4e92-8ab5-d2ff27249c56', 'Care plans are person-centred and up to date'),
('f563d1aa-baba-4e92-8ab5-d2ff27249c56', 'Care outcomes are monitored and reviewed'),

-- Staff Training and Competence (e026c56d-f29f-40ab-ac9c-1cb3e713c671)
('e026c56d-f29f-40ab-ac9c-1cb3e713c671', 'Induction programme is comprehensive'),
('e026c56d-f29f-40ab-ac9c-1cb3e713c671', 'Mandatory training is up to date'),
('e026c56d-f29f-40ab-ac9c-1cb3e713c671', 'Staff competency is regularly assessed'),

-- Consent and Mental Capacity (850d21b9-2e85-4635-8009-624f40ede832)
('850d21b9-2e85-4635-8009-624f40ede832', 'Mental capacity assessments are decision-specific'),
('850d21b9-2e85-4635-8009-624f40ede832', 'Best interest decisions are properly recorded'),
('850d21b9-2e85-4635-8009-624f40ede832', 'DoLS applications are made when required'),

-- Nutrition and Hydration (524ad2b3-7437-4807-8552-f749fa13bca9)
('524ad2b3-7437-4807-8552-f749fa13bca9', 'Nutritional assessments are completed'),
('524ad2b3-7437-4807-8552-f749fa13bca9', 'Food and fluid intake is monitored'),
('524ad2b3-7437-4807-8552-f749fa13bca9', 'Dietary requirements are met'),

-- Partnership Working (278fcd83-a63a-4f1b-829c-57da99536b58)
('278fcd83-a63a-4f1b-829c-57da99536b58', 'Effective relationships with healthcare professionals'),
('278fcd83-a63a-4f1b-829c-57da99536b58', 'Information sharing is appropriate'),
('278fcd83-a63a-4f1b-829c-57da99536b58', 'Transitions of care are well-managed');

-- Add evidence for CARING categories
INSERT INTO inspection_evidence (category_id, evidence_text) VALUES
-- Dignity and Respect (bdd00e02-19e6-42d2-891d-c008a922e53d)
('bdd00e02-19e6-42d2-891d-c008a922e53d', 'People are treated with dignity and respect'),
('bdd00e02-19e6-42d2-891d-c008a922e53d', 'Staff know people well and understand their needs'),
('bdd00e02-19e6-42d2-891d-c008a922e53d', 'Cultural and religious needs are respected'),

-- Privacy (01915c01-1bbf-453f-ae30-777db0ef2634)
('01915c01-1bbf-453f-ae30-777db0ef2634', 'Personal information is kept confidential'),
('01915c01-1bbf-453f-ae30-777db0ef2634', 'Privacy is maintained during personal care'),
('01915c01-1bbf-453f-ae30-777db0ef2634', 'People have private spaces when needed'),

-- Independence (9e97d39b-e1bb-4ce2-a324-a29c2f516272)
('9e97d39b-e1bb-4ce2-a324-a29c2f516272', 'People are supported to maintain independence'),
('9e97d39b-e1bb-4ce2-a324-a29c2f516272', 'People are involved in decisions about their care'),
('9e97d39b-e1bb-4ce2-a324-a29c2f516272', 'People are supported to access the community'),

-- Emotional Support (c61314f6-985a-4fb3-a5ac-ffd68520410d)
('c61314f6-985a-4fb3-a5ac-ffd68520410d', 'Emotional wellbeing is assessed and supported'),
('c61314f6-985a-4fb3-a5ac-ffd68520410d', 'Staff are sensitive to emotional needs'),
('c61314f6-985a-4fb3-a5ac-ffd68520410d', 'People have access to emotional support services');

-- Add evidence for RESPONSIVE categories
INSERT INTO inspection_evidence (category_id, evidence_text) VALUES
-- Person-Centred Care (4ed76d94-5b86-4058-884f-37c9074d3dd8)
('4ed76d94-5b86-4058-884f-37c9074d3dd8', 'Care is tailored to individual needs'),
('4ed76d94-5b86-4058-884f-37c9074d3dd8', 'People''s preferences are respected'),
('4ed76d94-5b86-4058-884f-37c9074d3dd8', 'Care is flexible and adapts to changing needs'),

-- Meeting Communication Needs (ee2621fc-7849-487f-a5c0-1377a025629b)
('ee2621fc-7849-487f-a5c0-1377a025629b', 'Communication needs are assessed and met'),
('ee2621fc-7849-487f-a5c0-1377a025629b', 'Information is provided in accessible formats'),
('ee2621fc-7849-487f-a5c0-1377a025629b', 'Interpreters are available when needed'),

-- Complaints Handling (6a4344f6-28e1-496e-b317-1ee1140e31d1)
('6a4344f6-28e1-496e-b317-1ee1140e31d1', 'Complaints procedure is accessible'),
('6a4344f6-28e1-496e-b317-1ee1140e31d1', 'Complaints are investigated and responded to'),
('6a4344f6-28e1-496e-b317-1ee1140e31d1', 'Learning from complaints is acted upon'),

-- End of Life Care (296fa954-ea71-4397-bc12-0603a24ea833)
('296fa954-ea71-4397-bc12-0603a24ea833', 'End of life care plans are in place'),
('296fa954-ea71-4397-bc12-0603a24ea833', 'Staff are trained in end of life care'),
('296fa954-ea71-4397-bc12-0603a24ea833', 'Families are supported during end of life');

-- Add evidence for WELL LED categories
INSERT INTO inspection_evidence (category_id, evidence_text) VALUES
-- Leadership and Management (cc22fa87-f065-4b7d-943a-94dbada4da5c)
('cc22fa87-f065-4b7d-943a-94dbada4da5c', 'Clear leadership and management structure'),
('cc22fa87-f065-4b7d-943a-94dbada4da5c', 'Managers are visible and accessible'),
('cc22fa87-f065-4b7d-943a-94dbada4da5c', 'Clear vision and values for the service'),

-- Governance and Quality Assurance (2f18b619-2aa3-417c-93ea-d935ceead203)
('2f18b619-2aa3-417c-93ea-d935ceead203', 'Quality audits are completed regularly'),
('2f18b619-2aa3-417c-93ea-d935ceead203', 'Action plans address identified issues'),
('2f18b619-2aa3-417c-93ea-d935ceead203', 'Key performance indicators are monitored'),

-- Culture and Values (76ad130c-b865-40fc-92ce-b5442f355439)
('76ad130c-b865-40fc-92ce-b5442f355439', 'Open and transparent culture'),
('76ad130c-b865-40fc-92ce-b5442f355439', 'Staff feel valued and supported'),
('76ad130c-b865-40fc-92ce-b5442f355439', 'People and families feel heard'),

-- Staff Engagement (f06f434d-03f8-4918-b25d-04a2215e4477)
('f06f434d-03f8-4918-b25d-04a2215e4477', 'Staff meetings are regular and effective'),
('f06f434d-03f8-4918-b25d-04a2215e4477', 'Staff feedback is sought and acted upon'),
('f06f434d-03f8-4918-b25d-04a2215e4477', 'Staff development is supported'),

-- Continuous Improvement (fd05cd3c-dea2-44bf-b9a6-8abd1df579eb)
('fd05cd3c-dea2-44bf-b9a6-8abd1df579eb', 'Service improvement plans are in place'),
('fd05cd3c-dea2-44bf-b9a6-8abd1df579eb', 'Innovation and best practice are embraced'),
('fd05cd3c-dea2-44bf-b9a6-8abd1df579eb', 'Learning from inspections is implemented');