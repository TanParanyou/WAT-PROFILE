import type { PrototypeContent } from "../prototype-data";
import styles from "./apothecary-register.module.css";

export default function ApothecaryRegister({ content }: { content: PrototypeContent }) {
  return <article className={styles.page}>
    <header className={styles.nav}><a href="#apothecary-top">{content.templeName}</a><nav aria-label="เมนูหลัก"><a href="#apothecary-story">รู้จักวัด</a><a href="#apothecary-events">กิจกรรม</a><a href="#apothecary-visit">การเดินทาง</a></nav><button type="button" aria-label="เปลี่ยนภาษา">TH · EN · DE</button></header>
    <section id="apothecary-top" className={styles.hero}><img src={content.heroImage} alt="พระสงฆ์ภายในวัดหลวงพ่อใส"/><div><p>{content.location}</p><h1>{content.message}</h1><a href="#apothecary-events">{content.primaryCta}</a></div></section>
    <section id="apothecary-story" className={styles.statement}><p>การปฏิบัติที่เริ่มต้นได้ทุกวัน</p><h2>ค่อย ๆ ทำความรู้จักความสงบ ในจังหวะของตนเอง</h2><p>{content.introduction}</p></section>
    <section id="apothecary-events" className={styles.events}><div className={styles.heading}><p>ทะเบียนกิจกรรม</p><h2>วันและเวลาที่จะได้พบกัน</h2></div>{content.events.map((event) => <article className={styles.eventRow} key={event.title}><time>{event.dateLabel}</time><div><h3>{event.title}</h3><p>{event.summary}</p></div><a href="#apothecary-visit">รายละเอียด</a></article>)}</section>
    <section id="apothecary-visit" className={styles.visit}><div><p>การมาเยือนครั้งแรก</p><h2>มาด้วยความสบายใจ แล้วให้สถานที่ทำหน้าที่ของมัน</h2><p>แต่งกายสุภาพ มาถึงก่อนกิจกรรม และแจ้งเราได้หากต้องการคำแนะนำเป็นภาษาไทยหรือเยอรมัน</p><a href="#apothecary-top">{content.secondaryCta}</a></div><img src={content.visitImage} alt="พื้นที่ตั้งวัดในเยอรมนี"/></section>
    <footer className={styles.footer}><strong>{content.templeName}</strong><button type="button">ดูช่องทางสนับสนุนวัด</button></footer>
  </article>;
}
