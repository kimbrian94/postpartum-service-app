INSERT INTO clients (
  email, name_korean, name_english, due_date, actual_delivery_date,
  residential_area, home_address, phone_number,
  has_pets, visitor_parking_available, other_household_members,
  pregnancy_number, cultural_background, familiar_with_korean_food,
  preferred_cuisine, referral_source, contact_platform, platform_username,
  referrer_name, preferred_language, night_nurse_weeks,
  internal_notes, status
) VALUES
-- 1–10
('client01@example.com','김민지','Minji Kim','2025-03-15','2025-03-10','North York','123 Yonge St, Toronto','647-555-0101',false,true,'Husband',1,'Korean',true,'Korean','Friend','KakaoTalk','minji_k','Soo Kim','Korean',2,'First-time mom','service_completed'),
('client02@example.com','이서연','Seoyeon Lee','2025-04-02',NULL,'Richmond Hill','88 Highway 7','647-555-0102',true,false,'Husband, dog',1,'Korean',true,'Korean','Instagram','Instagram','@seoyeonlee',NULL,'Korean',3,NULL,'service_in_progress'),
('client03@example.com','박지우','Jiwoo Park','2025-04-20',NULL,'Markham','12 Birchmount Rd','647-555-0103',false,true,'Husband, mother',2,'Korean',true,'Korean','Google','Website',NULL,NULL,'Korean',4,'Second baby','deposit_received'),
('client04@example.com',NULL,'Emily Chen','2025-05-01',NULL,'Scarborough','55 Finch Ave','647-555-0104',false,true,'Partner',1,'Chinese',false,'Chinese','Friend','WeChat','emilyc',NULL,'English',2,NULL,'pending_deposit'),
('client05@example.com','최유진','Yujin Choi','2025-02-28','2025-02-25','Downtown Toronto','9 Spadina Ave','647-555-0105',false,false,'Husband',1,'Korean',true,'Korean','Referral','Phone',NULL,'Nurse Hannah','Korean',1,NULL,'service_completed'),

-- 11–20
('client06@example.com','정하늘','Haneul Jung','2025-06-05',NULL,'Vaughan','77 Jane St','647-555-0106',true,true,'Husband, cat',2,'Korean',true,'Korean','Instagram','Instagram','@haneulmom',NULL,'Korean',4,NULL,'deposit_received'),
('client07@example.com',NULL,'Sarah Miller','2025-05-18',NULL,'Etobicoke','44 Lakeshore Blvd','647-555-0107',false,true,'Husband',1,'Canadian',false,'Western','Google','Website',NULL,NULL,'English',2,NULL,'pending_deposit'),
('client08@example.com','윤서','Yoonseo','2025-03-22','2025-03-18','Mississauga','101 Hurontario','647-555-0108',false,true,'Husband',1,'Korean',true,'Korean','Friend','KakaoTalk','yoonseo88',NULL,'Korean',2,NULL,'service_completed'),
('client09@example.com','강수아','Sua Kang','2025-06-15',NULL,'Oakville','33 Dundas St','647-555-0109',true,false,'Husband, dog',2,'Korean',true,'Fusion','Instagram','Instagram','@suakang',NULL,'Korean',3,NULL,'deposit_received'),
('client10@example.com',NULL,'Jessica Wong','2025-04-10','2025-04-06','Markham','9000 Kennedy Rd','647-555-0110',false,true,'Partner',1,'Chinese',false,'Chinese','Friend','WeChat','jwong',NULL,'English',1,NULL,'service_completed'),

-- 21–30
('client11@example.com','한지아','Jia Han','2025-07-01',NULL,'North York','222 Finch Ave','647-555-0111',false,true,'Husband',3,'Korean',true,'Korean','Referral','Phone',NULL,'OB Clinic','Korean',4,'High experience mom','deposit_received'),
('client12@example.com','서지민','Jimin Seo','2025-03-05','2025-03-01','York','14 Keele St','647-555-0112',false,false,'Husband',1,'Korean',true,'Korean','Instagram','Instagram','@jiminmom',NULL,'Korean',2,NULL,'service_completed'),
('client13@example.com',NULL,'Amanda Brown','2025-08-12',NULL,'Toronto','70 Queen St','647-555-0113',false,true,'Partner',1,'Canadian',false,'Western','Google','Website',NULL,NULL,'English',2,NULL,'pending_deposit'),
('client14@example.com','오하린','Harin Oh','2025-05-25',NULL,'Markham','18 Warden Ave','647-555-0114',true,true,'Husband, dog',2,'Korean',true,'Korean','Friend','KakaoTalk','harinoh',NULL,'Korean',3,NULL,'deposit_received'),
('client15@example.com','문서연','Seoyeon Moon','2025-02-10','2025-02-06','Scarborough','80 McCowan','647-555-0115',false,true,'Husband, mother-in-law',1,'Korean',true,'Korean','Referral','Phone',NULL,'Midwife','Korean',2,NULL,'service_completed'),

-- 31–40
('client16@example.com',NULL,'Linda Zhao','2025-06-30',NULL,'Richmond Hill','56 Bayview Ave','647-555-0116',false,true,'Partner',1,'Chinese',false,'Chinese','Friend','WeChat','lindaz',NULL,'English',3,NULL,'deposit_received'),
('client17@example.com','백나연','Nayeon Baek','2025-04-14','2025-04-10','Toronto','11 Bloor St','647-555-0117',false,false,'Husband',2,'Korean',true,'Korean','Instagram','Instagram','@nayeonb',NULL,'Korean',1,NULL,'service_completed'),
('client18@example.com','임수빈','Subin Lim','2025-07-20',NULL,'Vaughan','99 Rutherford Rd','647-555-0118',true,true,'Husband, dog',1,'Korean',true,'Korean','Google','Website',NULL,NULL,'Korean',4,NULL,'pending_deposit'),
('client19@example.com',NULL,'Rachel Kim','2025-05-05',NULL,'North York','30 Sheppard Ave','647-555-0119',false,true,'Partner',1,'Korean-Canadian',true,'Fusion','Friend','Text',NULL,NULL,'English',2,NULL,'deposit_received'),
('client20@example.com','장유나','Yuna Jang','2025-03-30','2025-03-26','Markham','5000 Hwy 7','647-555-0120',false,true,'Husband',1,'Korean',true,'Korean','Referral','Phone',NULL,'OB','Korean',2,NULL,'service_completed'),

-- 41–50
('client21@example.com','신아름','Areum Shin','2025-06-08',NULL,'Etobicoke','120 Kipling','647-555-0121',false,true,'Husband',2,'Korean',true,'Korean','Instagram','Instagram','@areumshin',NULL,'Korean',3,NULL,'deposit_received'),
('client22@example.com',NULL,'Nicole Adams','2025-09-01',NULL,'Toronto','88 Bathurst','647-555-0122',false,true,'Partner',1,'Canadian',false,'Western','Google','Website',NULL,NULL,'English',2,NULL,'pending_deposit'),
('client23@example.com','권하윤','Hayoon Kwon','2025-05-12',NULL,'North York','77 Steeles Ave','647-555-0123',true,false,'Husband, cat',1,'Korean',true,'Korean','Friend','KakaoTalk','hayoonk',NULL,'Korean',3,NULL,'deposit_received'),
('client24@example.com','유소라','Sora Yoo','2025-04-01','2025-03-28','Scarborough','3000 Eglinton','647-555-0124',false,true,'Husband',2,'Korean',true,'Korean','Referral','Phone',NULL,'Doula','Korean',2,NULL,'service_completed'),
('client25@example.com',NULL,'Michelle Park','2025-07-15',NULL,'Toronto','10 Front St','647-555-0125',false,true,'Partner',1,'Korean-Canadian',true,'Fusion','Instagram','Instagram','@michellep',NULL,'English',2,NULL,'pending_deposit');

