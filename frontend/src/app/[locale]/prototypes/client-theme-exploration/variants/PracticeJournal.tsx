import type { PrototypeContent } from "../prototype-data";
import styles from "./practice-journal.module.css";

export default function PracticeJournal({ content }: { content: PrototypeContent }) {
  return <article className={styles.page}>
    <header className={styles.nav}><a href="#journal-top">{content.templeName}</a><nav aria-label="เมนูหลัก"><a href="#journal-story">รู้จักวัด</a><a href="#journal-events">กิจกรรม</a><a href="#journal-visit">การเดินทาง</a></nav><button type="button" aria-label="เปลี่ยนภาษา">TH · EN · DE</button></header>
    <section id="journal-top" className={styles.hero}><div><p>{content.location}</p><h1>{content.message}</h1><a href="#journal-events">{content.primaryCta}</a></div><img src={content.heroImage} alt="พระสงฆ์ภายในวัดหลวงพ่อใส"/></section>
    <section id="journal-story" className={styles.manifesto}><p>บันทึกการปฏิบัติ</p><h2>ความสงบไม่ใช่ปลายทาง แต่เป็นพื้นที่ที่เรากลับมาได้เสมอ</h2><p>{content.introduction}</p></section>
    <section id="journal-events" className={styles.events}><div className={styles.heading}><p>กำหนดการ</p><h2>เรื่องที่กำลังเกิดขึ้น ณ วัด</h2></div><div className={styles.eventGrid}>{content.events.map((event, index) => <article className={styles.event} data-tone={index} key={event.title}><time>{event.dateLabel}</time><h3>{event.title}</h3><p>{event.summary}</p><a href="#journal-visit">ดูรายละเอียด</a></article>)}</div></section>
    <section id="journal-visit" className={styles.visit}><img src={content.visitImage} alt="พื้นที่ตั้งวัดในเยอรมนี"/><div><p>การมาเยือนครั้งแรก</p><h2>เริ่มจากการมาถึง แล้วปล่อยให้วันค่อย ๆ คลี่ออก</h2><p>แต่งกายสุภาพ มาถึงก่อนกิจกรรม และแจ้งเราได้หากต้องการคำแนะนำเป็นภาษาไทยหรือเยอรมัน</p><a href="#journal-top">{content.secondaryCta}</a></div></section>
    <footer className={styles.footer}><strong>{content.templeName}</strong><button type="button">ดูช่องทางสนับสนุนวัด</button></footer>
  </article>;
}
