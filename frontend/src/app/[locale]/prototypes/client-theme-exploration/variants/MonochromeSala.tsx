import type { PrototypeContent } from "../prototype-data";
import styles from "./monochrome-sala.module.css";

export default function MonochromeSala({
  content,
}: {
  content: PrototypeContent;
}) {
  const [featuredEvent, ...otherEvents] = content.events;

  return (
    <article className={styles.page}>
      <header className={styles.nav}>
        <a className={styles.brand} href="#monochrome-top">
          {content.templeName}
        </a>
        <nav aria-label="เมนูหลัก">
          <a href="#monochrome-story">รู้จักวัด</a>
          <a href="#monochrome-events">กิจกรรม</a>
          <a href="#monochrome-visit">การเดินทาง</a>
        </nav>
        <button type="button" aria-label="เปลี่ยนภาษา">
          TH · EN · DE
        </button>
      </header>

      <section id="monochrome-top" className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>{content.location}</p>
          <h1>{content.message}</h1>
          <div className={styles.actions}>
            <a href="#monochrome-events">{content.primaryCta}</a>
            <a href="#monochrome-visit">{content.secondaryCta}</a>
          </div>
        </div>
        <img
          src={content.heroImage}
          alt="พระสงฆ์ภายในวัดหลวงพ่อใส"
        />
      </section>

      <section id="monochrome-story" className={styles.statement}>
        <p>พื้นที่สำหรับทุกคน</p>
        <h2>ความสงบไม่จำเป็นต้องเริ่มจากความพร้อม</h2>
        <p className={styles.statementBody}>{content.introduction}</p>
      </section>

      <section id="monochrome-events" className={styles.events}>
        <div className={styles.sectionHeading}>
          <p>กิจกรรมที่กำลังจะมาถึง</p>
          <h2>เข้าร่วมการปฏิบัติ</h2>
        </div>

        <article className={styles.featuredEvent}>
          <img src={featuredEvent.image} alt="" />
          <div>
            <time>{featuredEvent.dateLabel}</time>
            <h3>{featuredEvent.title}</h3>
            <p>{featuredEvent.summary}</p>
            <a href="#monochrome-visit">ดูรายละเอียดกิจกรรม</a>
          </div>
        </article>

        <div className={styles.eventList}>
          {otherEvents.map((event) => (
            <article key={event.title}>
              <time>{event.dateLabel}</time>
              <div>
                <h3>{event.title}</h3>
                <p>{event.summary}</p>
              </div>
              <a href="#monochrome-visit">รายละเอียด</a>
            </article>
          ))}
        </div>
      </section>

      <section id="monochrome-visit" className={styles.visit}>
        <img src={content.visitImage} alt="พื้นที่ตั้งวัดในเยอรมนี" />
        <div>
          <p>การมาเยือนครั้งแรก</p>
          <h2>เตรียมตัวเพียงเล็กน้อย แล้วมาอย่างที่คุณเป็น</h2>
          <p>
            แต่งกายสุภาพ มาถึงก่อนกิจกรรม และแจ้งเราได้หากต้องการคำแนะนำ
            ภาษาไทยหรือภาษาเยอรมัน
          </p>
          <a href="#monochrome-top">{content.secondaryCta}</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>{content.templeName}</strong>
          <p>พื้นที่แห่งการปฏิบัติใน Großkrotzenburg</p>
        </div>
        <button type="button">ดูช่องทางสนับสนุนวัด</button>
      </footer>
    </article>
  );
}
