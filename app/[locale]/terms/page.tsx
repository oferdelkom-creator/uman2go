import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "תקנון" };

export default function TermsPage() {
  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold text-brand-navy">תקנון ותנאי שימוש</h1>
        <div className="mt-8 flex flex-col gap-6 leading-relaxed text-foreground/80">
          <p>
            {SITE_NAME} משמשת כפלטפורמת חיבור בין מטיילים לבין מלונות, נהגים ומדריכי טיולים עצמאיים
            הפועלים באומן. ההזמנה בפועל, התשלום והשירות ניתנים על ידי נותן השירות (בעל המלון/הנהג/המדריך)
            ולא על ידי הפלטפורמה עצמה.
          </p>
          <p>
            עמלת פלטפורמה קבועה נגבית עבור השימוש בשירות, בנוסף למחיר ששולם ישירות לנותן השירות. פרטי
            העמלה מוצגים בתהליך ההזמנה.
          </p>
          <p>
            ביטולים ושינויים כפופים למדיניות הביטולים של נותן השירות הספציפי. אנו ממליצים לברר את
            מדיניות הביטולים לפני אישור ההזמנה.
          </p>
          <p>
            שימוש באתר מהווה הסכמה לתנאים אלו. אנו שומרים על הזכות לעדכן את התקנון מעת לעת.
          </p>
        </div>
      </div>
    </Section>
  );
}
