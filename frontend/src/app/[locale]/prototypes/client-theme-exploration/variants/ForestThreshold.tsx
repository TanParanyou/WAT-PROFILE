import type { PrototypeContent } from "../prototype-data";
import styles from "./forest-threshold.module.css";

export default function ForestThreshold({ content }: { content: PrototypeContent }) {
  return <article className={styles.page}>
    <header className={styles.nav}><a href="#forest-top">{content.templeName}</a><nav aria-label="เมนูหลัก"><a href="#forest-story">รู้จักวัด</a><a href="#forest-events">กิจกรรม</a><a href="#forest-visit">การเดินทาง</a></nav><button type="button">TH · EN · DE</button></header>
    <section id="forest-top" className={styles.hero}><img src={content.heroImage} alt="พระสงฆ์ภายในวัดหลวงพ่อใส" /><div><p>{content.location}</p><h1>{content.message}</h1><p className={styles.actions}><a href="#forest-events">{content.primaryCta}</a><a href="#forest-visit">{content.secondaryCta}</a></p></div></section>
    <section id="forest-story" className={styles.story}><div><h2>เริ่มต้นจากความสงบที่เข้าถึงได้</h2><p>{content.introduction}</p></div><img src={content.storyImage} alt="อาคารวัดหลวงพ่อใสในเยอรมนี" /></section>
    <section id="forest-events" className={styles.events}><p>กิจกรรมที่กำลังจะมาถึง</p><h2>ก้าวต่อไปของการปฏิบัติ</h2>{content.events.map((event) => <article key={event.title}><img src={event.image} alt="" /><div><p>{event.dateLabel}</p><h3>{event.title}</h3><p>{event.summary}</p><a href="#forest-visit">เข้าร่วมกิจกรรม</a></div></article>)}</section>
    <section id="forest-visit" className={styles.visit}><img src={content.visitImage} alt="พื้นที่ตั้งวัดในเยอรมนี" /><div><h2>มาอย่างที่คุณเป็น</h2><p>แต่งกายสุภาพ มาถึงก่อนกิจกรรม และแจ้งเราได้หากเป็นการมาเยือนครั้งแรก</p><a href="#forest-top">{content.secondaryCta}</a></div></section>
    <footer><strong>{content.templeName}</strong><p>ร่วมรักษาพื้นที่แห่งการปฏิบัติให้เปิดต้อนรับทุกคน</p><button type="button">ดูช่องทางสนับสนุนวัด</button></footer>
  </article>;
}
