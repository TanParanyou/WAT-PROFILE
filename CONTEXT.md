# WAT-PROFILE

คำศัพท์ร่วมสำหรับเว็บไซต์วัดและงานดูแลข้อมูลของผู้ดูแลระบบ

## Contact Inquiries

**Contact Inquiry**:
คำถามหรือข้อความที่ผู้ติดต่อส่งถึงวัดผ่านช่องทางติดต่อสาธารณะ และรอการดำเนินการจากผู้ดูแล
_Avoid_: Contact, Message

**New Inquiry**:
Contact Inquiry ที่ผู้ดูแลยังไม่ได้เปิดอ่าน
_Avoid_: Pending Inquiry

**Read Inquiry**:
Contact Inquiry ที่ผู้ดูแลเปิดอ่านแล้ว แต่ยังไม่ได้บันทึกการตอบกลับ

**Replied Inquiry**:
Contact Inquiry ที่มีการบันทึกคำตอบจากผู้ดูแลแล้ว

**Archived Inquiry**:
Contact Inquiry ที่นำออกจากงานที่กำลังดำเนินการโดยไม่ลบประวัติ
_Avoid_: Closed Inquiry

## Event Registrations

**Event Registration**:
คำขอเข้าร่วมกิจกรรมที่บุคคลส่งให้วัด และติดตามตั้งแต่รอการยืนยันจนถึงการเข้าร่วมหรือยกเลิก

**Pending Registration**:
Event Registration ที่ยังไม่ได้รับการยืนยันจากผู้ดูแล

**Confirmed Registration**:
Event Registration ที่ผู้ดูแลยืนยันสิทธิ์เข้าร่วมแล้ว
_Avoid_: Approved Registration

**Attended Registration**:
Event Registration ที่มีการบันทึกว่าผู้ลงทะเบียนเข้าร่วมกิจกรรมแล้ว

**Cancelled Registration**:
Event Registration ที่สิ้นสุดก่อนการเข้าร่วม โดยอาจมีเหตุผลประกอบ
_Avoid_: Rejected Registration

## Donations

**Donation Record**:
ข้อมูลการบริจาคหนึ่งรายการที่วัดติดตามยอดเงิน ผู้บริจาค ช่องทางรับเงิน และสถานะการยืนยัน
_Avoid_: Donation, Payment

**Self-Reported Donation**:
Donation Record ที่ผู้บริจาคส่งข้อมูลและหลักฐานการโอนด้วยตนเอง
_Avoid_: Online Donation

**Staff-Recorded Donation**:
Donation Record ที่เจ้าหน้าที่วัดบันทึกจากเงินสด รายการเดินบัญชี หรือข้อมูลที่ได้รับนอกระบบ
_Avoid_: Manual Donation

**Member-Linked Donation**:
Donation Record ที่เชื่อมกับบัญชีสมาชิกของผู้บริจาค เพื่อให้สมาชิกติดตามประวัติและสถานะของรายการตนเองได้ ผู้เยี่ยมชมยังสามารถสร้าง Donation Record ได้โดยไม่ต้องมีบัญชีสมาชิก
_Avoid_: Member-Only Donation

**Confirmed Donation**:
Donation Record ที่เจ้าหน้าที่ตรวจสอบการรับเงินแล้ว
_Avoid_: Paid Donation

**Pending Donation**:
Donation Record ที่ยังรอเจ้าหน้าที่ตรวจสอบการรับเงินหรือหลักฐานการโอน
_Avoid_: Unverified Donation

**Donation Proof**:
หลักฐานการชำระเงินที่ผู้บริจาคแนบมากับ Self-Reported Donation เพื่อให้เจ้าหน้าที่ซึ่งมีสิทธิ์จัดการการบริจาคตรวจสอบ เป็นข้อมูลส่วนตัวและห้ามเข้าถึงผ่านสาธารณะ
_Avoid_: Payment Slip

**Donation Acknowledgement**:
อีเมลอัตโนมัติที่ยืนยันว่าได้รับ Self-Reported Donation แล้ว โดยไม่ยืนยันว่าได้รับเงินหรือออกใบเสร็จ
_Avoid_: Receipt

**Receipt Request**:
ความประสงค์ของผู้บริจาคที่จะขอใบเสร็จ ซึ่งยังไม่ถือว่าออกหรือส่งใบเสร็จจนกว่า Donation Record จะเป็น Confirmed Donation

**General Donation Receipt**:
ใบเสร็จรับเงินที่วัดออกให้สำหรับ Donation Record ที่ยืนยันแล้ว โดยไม่เป็นเอกสารรับรองเพื่อการลดหย่อนภาษี

**Receipt Dispatch**:
การที่เจ้าหน้าที่เริ่มส่งใบเสร็จของ Confirmed Donation หลังตรวจสอบข้อมูลผู้รับเรียบร้อยแล้ว
_Avoid_: Automatic Receipt

**Donation Certificate**:
ใบอนุโมทนาบัตรดิจิทัลที่สร้างขึ้นสำหรับ Confirmed Donation พร้อมตราประทับวัด ลายเซ็นดิจิทัลที่ผ่านการอนุมัติ และสามารถดาวน์โหลดเป็น PDF หรือภาพได้
_Avoid_: Donation Diploma, Award

**Digital Signature Preset**:
ชุดข้อมูลลายเซ็นและตราประทับของเจ้าอาวาสหรือตัวแทนวัดที่บันทึกไว้ในระบบ เพื่อนำไปประทับบนใบอนุโมทนาบัตรอย่างเป็นทางการ

## Calendar & Resources

**Calendar Resource**:
ทรัพยากรหรือสถานที่ของวัด (เช่น ศาลาปฏิบัติธรรม, ลานธรรม, กุฏิรับรอง) ที่ผูกกับกิจกรรมในปฏิทิน เพื่อช่วยระบุสถานที่และจัดสรรพื้นที่
_Avoid_: Location Tag, Facility Room

**Inline Resource**:
Resource ที่กำหนดรหัสและชื่อโดยตรงในกิจกรรม โดยไม่ต้องลงทะเบียนในระบบจัดการทรัพยากรกลาง

**Managed Resource Registry**:
ทะเบียนทรัพยากรส่วนกลางที่ควบคุมสิทธิ์การเข้าถึง ความจุ และการแสดงผลต่อสาธารณะ (`/admin/calendar/resources`)

## Media

**Media Recycle Bin**:
พื้นที่เก็บ Media ที่ถูกลบไว้ชั่วคราวเป็นเวลา 30 วันก่อนลบถาวร และยังสามารถกู้คืนได้ในช่วงเวลาดังกล่าว
_Avoid_: Permanent Deletion

## Personal Data Requests

**Personal Data Request**:
คำขอของบุคคลเพื่อเข้าถึง ส่งออก แก้ไข หรือลบข้อมูลส่วนบุคคลที่วัดเก็บไว้
_Avoid_: Privacy Ticket

**Personal Data Erasure**:
การลบหรือทำข้อมูลส่วนบุคคลให้ไม่สามารถระบุตัวบุคคลได้ หลังเจ้าหน้าที่ตรวจและยืนยันคำขอแล้ว
_Avoid_: Immediate Deletion

## News & Articles

**News Article**:
บทความหรือข่าวประชาสัมพันธ์ของวัด ที่มีเนื้อหาขนาดยาว รูปภาพประกอบ และรองรับ 3 ภาษา (TH/EN/DE)
_Avoid_: Post, Blog, News Entry

**News Category**:
หมวดหมู่สำหรับจัดกลุ่มข่าวสารและบทความ เช่น ข่าวประชาสัมพันธ์, เกร็ดธรรมะ, รายงานกิจกรรม
_Avoid_: Topic, Type

**Featured Article**:
News Article ที่ถูกปักหมุดให้แสดงเป็นข่าวเด่นในหน้าแรกหรือด้านบนสุดของหน้ารายการข่าว
_Avoid_: Pinned Post, Highlight

**Draft Article**:
News Article ที่อยู่ระหว่างการร่าง ยังไม่แสดงบนเว็บไซต์สาธารณะ

**Scheduled Article**:
News Article ที่ตั้งเวลาเผยแพร่ล่วงหน้า และจะแสดงผลบนเว็บไซต์สาธารณะเมื่อถึงเวลาที่กำหนด

**Published Article**:
News Article ที่เผยแพร่บนเว็บไซต์สาธารณะเรียบร้อยแล้ว

**Archived Article**:
News Article ที่ปลดออกจากการเผยแพร่โดยไม่ลบข้อมูลออกจากระบบ

## Site Alerts & Announcements

**Site Alert**:
ข้อความประกาศด่วนหรือแจ้งเตือนสำคัญของวัด ที่แสดงเป็นแถบด้านบนหรือป๊อปอัปบนหน้าเว็บ
_Avoid_: Notification, Flash News

**Alert Banner**:
Site Alert ที่แสดงเป็นแถบข้อความด้านบนสุดของหน้าเว็บ

**Alert Popup**:
Site Alert ที่แสดงเป็นหน้าต่างป๊อปอัปตรงกลางจอ สำหรับกรณีฉุกเฉินระดับวิกฤต

**Dismissed Alert**:
Site Alert ที่ผู้เข้าชมกดปิด (✕) แล้ว และระบบจำสถานะไว้ใน LocalStorage เพื่อไม่ให้แสดงซ้ำ

## Digital Chanting & Holy Days

**Chanting Entry**:
บทสวดมนต์ในหนังสือสวดมนต์ดิจิทัล ที่มีเนื้อหาบทสวดภาษาบาลี คำแปล 3 ภาษา (ไทย, อังกฤษ, เยอรมัน) และไฟล์เสียงสวดมนต์ (Audio Recording)
_Avoid_: Song, Prayer Track

**Holy Day (Uposatha Day)**:
วันพระหรือวันธรรมสวนะตามปฏิทินจันทรคติ ที่วัดจัดกิจกรรมสวดมนต์ ปฏิบัติธรรม หรือถ่ายทอดสดออนไลน์เป็นพิเศษ

## AI Chatbot & Knowledge Base

**Chatbot Knowledge Entry**:
ชุดข้อมูลคำถาม-คำตอบ (Q&A Pair) หรือเนื้อหาธรรมะที่เจ้าหน้าที่บันทึกไว้ในคลังความรู้ เพื่อให้ AI นำไปตอบคำถามผู้เยี่ยมชมเว็บไซต์ได้อย่างถูกต้อง
_Avoid_: Bot Script, FAQ Item

**Sanitized Query**:
ข้อความคำถามจากผู้ใช้ที่ผ่านการคัดกรองอักขระพิเศษ คำหยาบ และความพยายามทำ Prompt Injection ก่อนส่งให้ระบบประมวลผล

## Community Q&A

**Community Question**:
กระทู้คำถามหรือข้อสงสัยเกี่ยวกับธรรมะ การปฏิบัติ หรือกิจกรรมของวัด ที่สมาชิกตั้งขึ้นในกระดานสนทนาธรรม
_Avoid_: Thread, Forum Post

**Community Answer**:
คำตอบหรือความเห็นจากสมาชิกในชุมชนต่อ Community Question

**Official Answer**:
คำตอบอย่างเป็นทางการจากคณะสงฆ์หรือผู้ดูแลระบบ ที่ได้รับการปักหมุดและยืนยันความถูกต้องแล้ว

**Community Moderation Queue**:
คิวรายงานเนื้อหาที่ไม่เหมาะสม เพื่อให้เจ้าหน้าที่ตรวจสอบ ระงับ หรืออนุมัติการแสดงผล

**Member Restriction**:
การระงับสิทธิ์การโพสต์หรือแสดงความคิดเห็นของสมาชิกชั่วคราวหรือถาวร เมื่อทำผิดกฎชุมชน

## Visitor Analytics

**Page View Record**:
บันทึกการเข้าชมหน้าเว็บแบบไม่ระบุตัวบุคคล (Anonymized) ที่เก็บข้อมูลเส้นทางหน้าเว็บ (Path), อุปกรณ์ (Device Type), เบราว์เซอร์ และวันเวลา เพื่อใช้ในการวิเคราะห์สถิติ

**Analytics Hub**:
ศูนย์รวมข้อมูลสถิติและการวิเคราะห์เชิงภาพ (Visual Analytics) สำหรับผู้ดูแลระบบ เพื่อดูแนวโน้มผู้เข้าชมและเนื้อหายอดนิยม


