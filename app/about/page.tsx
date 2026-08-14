import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = { title: "אודות" };

export default function AboutPage() {
  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold text-brand-navy">אודות {SITE_NAME}</h1>
        <p className="mt-4 text-lg text-foreground/70">{SITE_TAGLINE}</p>
        <div className="mt-8 flex flex-col gap-6 leading-relaxed text-foreground/80">
          <p>
            {SITE_NAME} הוקמה כדי לפתור בעיה פשוטה: תכנון נסיעה לאומן כרוך בעשרות שיחות טלפון, קבוצות
            וואטסאפ ומודעות מפוזרות. אנחנו מרכזים במקום אחד את כל מה שצריך - מלונות מאומתים, נהגים
            אמינים וטיולים מודרכים - כדי שתוכלו להתמקד בעיקר.
          </p>
          <p>
            כל מלון, נהג ומדריך טיולים באתר עברו אימות בסיסי מטעמנו. אנחנו ממליצים תמיד לתאם ישירות
            מול נותן השירות לפני התשלום, ולשמור על תקשורת דרך הפלטפורמה ככל שניתן.
          </p>
        </div>
      </div>
    </Section>
  );
}
