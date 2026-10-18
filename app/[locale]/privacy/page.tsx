import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Link } from "@/i18n/navigation";
const policies: Record<string, {title: string; updated: string; sections: string[][]}> = {
  "he": {
    "title": "מדיניות פרטיות",
    "updated": "עודכן ביום 18.10.2026",
    "sections": [
      [
        "מי אחראי למידע",
        "UMAN2GO מופעל על ידי דלקום ע י קום בע״מ, ח״פ 515917516, לוי אשכול 80, דירה 2, תל אביב, ישראל. החברה היא בעלת השליטה במידע שנאסף לצורך הפעלת האתר. לבקשות פרטיות: ofer.delkom@gmail.com או 053-332-9778."
      ],
      [
        "מסירת מידע היא לבחירתכם",
        "אין חובה חוקית כללית למסור את פרטי הטפסים או לשוחח עם הבוט. שדות המסומנים כחובה נחוצים לשירות שביקשתם; בלעדיהם לא נוכל להשלים הרשמה, להשיב או לטפל בבקשה. אפשר לפנות גם בטלפון או בדוא״ל. אין למסור מידע על אדם אחר ללא הרשאה מתאימה."
      ],
      [
        "איזה מידע נאסף ולמה",
        "בהרשמה ובפניות נאספים שם, פרטי קשר, שפה, פרטי חשבון ותוכן שמסרתם. בבקשות נסיעה עשויים להיאסף תאריכים, מסלול, מספר נוסעים והעדפות. מספקים נאספים פרטי השירות, תמונות ופרטי קשר. המידע משמש לניהול חשבון, טיפול בפניות ובהזמנות, תיאום עם ספקים, תמיכה, מניעת שימוש לרעה וקיום חובות דין. נתוני מכשיר, דפדפן, כתובת IP ויומני פעילות עשויים להיות מעובדים לצורכי אבטחה ותפעול."
      ],
      [
        "שיחות עם העוזר הדיגיטלי",
        "העוזר משתמש בבינה מלאכותית של Anthropic. הודעות והקשר השיחה נשלחים לשירות לצורך יצירת תשובות וסיכומים, ונשמרים במערכות האתר לצורך המשך טיפול. הצוות יכול לעיין בשיחה וסיכום עם פרטי קשר עשוי להישלח אליו בדוא״ל. אין להזין בצ׳אט סיסמאות, קודי אימות, פרטי אשראי, צילום תעודה או מידע רגיש שאינו נחוץ. הצעות הבוט אינן אישור הזמנה, מחיר או זמינות."
      ],
      [
        "למי המידע נמסר",
        "פרטים הדרושים לטיפול עשויים להימסר לצוות ולספק השירות הרלוונטי, כגון מלון, נהג או מארגן טיול, לצורך תיאום וביצוע בקשתכם. ספקי התשתית כוללים Vercel לאירוח ולמדידת שימוש, Supabase לאחסון ולאימות, Anthropic לשירותי AI ו־Resend לשליחת דוא״ל, בהתאם לתכונות שבשימוש. מידע עשוי להימסר גם ליועצים או לרשות מוסמכת כאשר הדבר נדרש כדין. תוכן ותמונות שמספק מגיש לפרסום עשויים להופיע ברשומה ציבורית לאחר אישורה; אין להעלות מידע פרטי או תמונות ללא זכויות והרשאות מתאימות."
      ],
      [
        "שירותים מחוץ לישראל וקישורים חיצוניים",
        "חלק מספקי התשתית וספקי התיירות נמצאים מחוץ לישראל, ולכן מידע עשוי להיות מאוחסן או מעובד בחו״ל, לרבות אצל ספק השירות באוקראינה או במדינת היעד. העברה תיעשה בהתאם לדין החל. פתיחת WhatsApp, Telegram, Facebook או אתר ספק כפופה גם למדיניות השירות החיצוני. מיקום GPS אינו נדרש לגלישה רגילה; בבקשת מונית דרך Telegram הוא נמסר רק אם תבחרו לשתפו שם."
      ],
      [
        "עוגיות ומדידת שימוש",
        "האתר משתמש בעוגיות ובאחסון מקומי ככל שנחוץ להתחברות, להעדפת שפה ולרציפות שיחה. באתר משולב Vercel Analytics למדידת שימוש וביצועים. ניתן לנהל עוגיות דרך הדפדפן; חסימת עוגיות חיוניות עלולה לפגוע בהתחברות או בשירות. מדיניות זו אינה הסכמה גורפת למעקב או לפרסום."
      ],
      [
        "שמירה ואבטחה",
        "משך השמירה תלוי בסוג המידע, בצורך בטיפול ובתיעוד, בחובות דין ובמחלוקות; מדיניות זו אינה מבטיחה מחיקה אוטומטית במועד קבוע. ננקטים אמצעי אבטחה והרשאות, אך לא ניתן להבטיח הגנה מוחלטת. ספק תשלום חיצוני, אם נבחר בעסקה, מטפל בפרטי התשלום לפי תנאיו; אין לשלוח אותם בטופס פנייה או בצ׳אט."
      ],
      [
        "זכויות ובקשות פרטיות",
        "ניתן לבקש לעיין במידע האישי עליכם ולבקש לתקן מידע שאינו נכון, שלם, ברור או מעודכן, בהתאם לסעיפים 13 ו־14 לחוק הגנת הפרטיות ובכפוף לחריגים. אפשר לפנות גם בבקשה למחיקה או להפסקת שימוש; הבקשה תיבחן לפי הדין, מטרת השמירה וחובות התיעוד, ואין זכות מחיקה גורפת בכל מקרה. נבקש אימות זהות מידתי לפני מסירת מידע. פנו ל־ofer.delkom@gmail.com עם הכותרת ״בקשת פרטיות UMAN2GO״, בלי לצרף מסמכי זיהוי רגישים בשלב הראשון."
      ],
      [
        "דיוור ועדכונים למדיניות",
        "מסירת פרטים לפנייה, הרשמה או ביטול אינה הסכמה לקבלת פרסומות. הודעות שירות נשלחות לצורך הטיפול המבוקש; דיוור שיווקי יישלח רק בהתאם לדין ועם אפשרות הסרה. שינוי מהותי במטרות השימוש ילווה ביידוע ובהסכמה ככל שנדרשת, ולא רק בשינוי נוסח הדף. זכויות מחייבות לפי דין גוברות על מדיניות זו."
      ]
    ]
  },
  "en": {
    "title": "Privacy policy",
    "updated": "Updated 18 October 2026",
    "sections": [
      [
        "Who controls your information",
        "UMAN2GO is operated by דלקום ע י קום בע״מ, Israeli company no. 515917516, 80 Levi Eshkol St., Apt. 2, Tel Aviv, Israel. The company controls information collected to operate this site. Privacy contact: ofer.delkom@gmail.com or +972-53-332-9778."
      ],
      [
        "Your choice to provide information",
        "There is no general legal duty to complete our forms or use the assistant. Required fields are needed for the requested service; without them we may be unable to register your account, respond or process your request. You may also contact us by telephone or email. Provide another person’s information only with appropriate authority."
      ],
      [
        "Information and purposes",
        "We collect names, contact details, language, account details and submitted content. Travel requests may include dates, routes, passenger counts and preferences. Provider applications include service information, photographs and contact details. We use this to manage accounts, enquiries and bookings, coordinate providers, offer support, prevent abuse and meet legal duties. Device, browser, IP and activity logs may be processed for security and operations."
      ],
      [
        "AI conversations",
        "The assistant uses Anthropic AI. Messages and conversation context are sent to that service to produce answers and summaries and are stored in our systems for follow-up. Our team may view conversations and receive summaries with contact details by email. Do not enter passwords, verification codes, card details, identity documents or unnecessary sensitive information. AI suggestions do not confirm bookings, prices or availability."
      ],
      [
        "Recipients",
        "Necessary details may be shared with our team and the relevant hotel, driver or tour organizer to handle your request. Infrastructure providers include Vercel for hosting and usage measurement, Supabase for storage and authentication, Anthropic for AI and Resend for email, depending on the feature used. Information may also be provided to advisers or competent authorities when lawfully required. Provider content and photos submitted for publication may appear in approved public listings; upload only content you are entitled and authorized to publish."
      ],
      [
        "International processing and external services",
        "Infrastructure and travel providers may process or store information outside Israel, including Ukraine or your destination, subject to applicable law. WhatsApp, Telegram, Facebook and provider websites also have their own policies. GPS is not required for ordinary browsing; for a Telegram taxi request, location is supplied only if you choose to share it there."
      ],
      [
        "Cookies and analytics",
        "Cookies and local storage may support sign-in, language preferences and conversation continuity. The site includes Vercel Analytics for usage and performance measurement. Browser settings allow you to manage cookies; blocking essential cookies may affect sign-in or service. This policy is not blanket consent to tracking or advertising."
      ],
      [
        "Retention and security",
        "Retention depends on the information, handling and recordkeeping needs, legal duties and disputes; this policy does not promise automatic deletion after a fixed period. We use security and access controls but cannot guarantee absolute protection. An external payment provider, where used, handles payment details under its terms; do not send those details in enquiry forms or chat."
      ],
      [
        "Your rights",
        "Under applicable Israeli law, including sections 13 and 14 of the Protection of Privacy Law and their exceptions, you may request access to your personal information and correction of inaccurate, incomplete, unclear or outdated information. You may also request deletion or cessation of use; we assess such requests against legal and recordkeeping duties, and deletion is not unconditional. Proportionate identity checks may be required. Email ofer.delkom@gmail.com with subject “UMAN2GO privacy request”; do not attach sensitive identity documents initially."
      ],
      [
        "Marketing and changes",
        "Making an enquiry, signing up or cancelling does not constitute advertising consent. Service messages support your request. Marketing will follow applicable law and provide an opt-out. Material changes to processing purposes require notice and consent where required, not merely an edited policy. Mandatory legal rights prevail."
      ]
    ]
  },
  "fr": {
    "title": "Politique de confidentialité",
    "updated": "Mise à jour : 18 octobre 2026",
    "sections": [
      [
        "Responsable et contact",
        "UMAN2GO est exploité par דלקום ע י קום בע״מ, société israélienne n° 515917516, 80 rue Levi Eshkol, appartement 2, Tel Aviv, Israël. La société détermine les finalités du traitement. Contact : ofer.delkom@gmail.com ; +972-53-332-9778."
      ],
      [
        "Votre choix et les données",
        "Les formulaires et l’assistant sont facultatifs : aucune obligation légale générale ne vous impose de les utiliser. Sans les champs nécessaires, nous pouvons ne pas être en mesure de créer un compte, répondre ou traiter votre demande. Nous recueillons coordonnées, langue, compte, messages, dates, trajets, voyageurs et préférences ; les prestataires fournissent aussi descriptions et photos. Ces données servent au suivi, aux réservations, à la coordination, au support, à la sécurité et aux obligations légales. Des données techniques et journaux peuvent être traités. Ne communiquez les données d’autrui qu’avec autorisation."
      ],
      [
        "Assistant et destinataires",
        "Les messages et leur contexte sont transmis à Anthropic pour les réponses et résumés, puis conservés pour le suivi par l’équipe. Des résumés avec coordonnées peuvent être envoyés à l’équipe par e-mail. Les informations nécessaires sont partagées avec le prestataire concerné : hôtel, chauffeur ou organisateur. Vercel assure hébergement et mesure d’usage, Supabase stockage et authentification, Resend les e-mails, selon les fonctionnalités utilisées. Des transmissions légales à des autorités ou conseillers sont possibles. Les contenus et photos destinés aux annonces peuvent devenir publics après approbation. Ne transmettez ni carte bancaire, mot de passe, code, document d’identité ni information sensible inutile. L’IA ne confirme pas une réservation."
      ],
      [
        "Traitement international et services externes",
        "Des traitements peuvent avoir lieu hors d’Israël, notamment chez les prestataires en Ukraine ou à destination, conformément au droit applicable. WhatsApp, Telegram, Facebook et les sites externes appliquent leurs propres politiques. Le GPS n’est pas nécessaire pour consulter le site ; il est partagé dans Telegram uniquement si vous le choisissez pour une demande de taxi."
      ],
      [
        "Cookies et mesure",
        "Des cookies et le stockage local permettent connexion, langue et continuité des échanges. Vercel Analytics mesure usage et performances. Les réglages du navigateur permettent de gérer les cookies ; bloquer les éléments essentiels peut affecter le service. Cette politique ne constitue pas un consentement général au suivi ou à la publicité."
      ],
      [
        "Conservation et sécurité",
        "La durée dépend des besoins de suivi et de preuve, des obligations légales et des litiges ; aucun délai automatique de suppression n’est promis ici. Des mesures de sécurité et de contrôle d’accès sont utilisées sans garantie absolue. Le prestataire de paiement externe, s’il est utilisé, traite les données de paiement selon ses conditions ; ne les envoyez pas dans un formulaire ou un chat."
      ],
      [
        "Vos droits",
        "Selon le droit israélien applicable, notamment les articles 13 et 14 de la loi sur la protection de la vie privée et leurs exceptions, vous pouvez demander accès et rectification des informations inexactes, incomplètes, imprécises ou périmées. Toute demande de suppression ou d’arrêt d’utilisation sera examinée au regard des obligations de conservation ; la suppression n’est pas inconditionnelle. Une vérification proportionnée d’identité peut être nécessaire. Écrivez à ofer.delkom@gmail.com, objet « Demande de confidentialité UMAN2GO », sans document d’identité sensible dans le premier message."
      ],
      [
        "Publicité et modifications",
        "Une demande, inscription ou annulation ne vaut pas accord publicitaire. Les messages de service concernent votre demande. La prospection respecte le droit applicable avec possibilité de désinscription. Un changement important de finalité nécessite information et consentement lorsqu’il est requis. Les droits impératifs prévalent."
      ]
    ]
  },
  "uk": {
    "title": "Політика конфіденційності",
    "updated": "Оновлено 18 жовтня 2026 року",
    "sections": [
      [
        "Відповідальна компанія",
        "UMAN2GO керує דלקום ע י קום בע״מ, реєстраційний номер в Ізраїлі 515917516, вул. Леві Ешколь, 80, кв. 2, Тель-Авів, Ізраїль. Компанія визначає цілі обробки. Контакт: ofer.delkom@gmail.com, +972-53-332-9778."
      ],
      [
        "Ваш вибір, дані та цілі",
        "Загального юридичного обов’язку заповнювати форми або користуватися помічником немає. Без обов’язкових для послуги полів ми можемо не зареєструвати обліковий запис, не відповісти або не опрацювати запит. Збираємо ім’я, контакти, мову, дані облікового запису, повідомлення, дати, маршрути, кількість пасажирів і побажання; від постачальників — опис послуг та фото. Це потрібно для підтримки, бронювань, координації, безпеки та юридичних обов’язків. Можлива обробка технічних даних і журналів. Чужі дані надавайте лише з належним дозволом."
      ],
      [
        "ШІ та одержувачі",
        "Повідомлення і контекст передаються Anthropic для відповідей і підсумків та зберігаються для подальшої роботи команди. Команда може переглядати розмови й отримувати підсумки з контактами електронною поштою. Необхідні дані передаються відповідному готелю, водію або організатору. Vercel забезпечує хостинг і вимірювання використання, Supabase — зберігання й автентифікацію, Resend — електронні листи, залежно від функцій. Законна передача консультантам чи органам влади також можлива. Матеріали й фото для оголошень можуть стати публічними після схвалення. Не надсилайте платіжні реквізити, паролі, коди, документи чи зайві чутливі відомості. Відповідь ШІ не підтверджує бронювання."
      ],
      [
        "Міжнародна обробка та зовнішні сервіси",
        "Дані можуть оброблятися поза Ізраїлем, зокрема постачальниками в Україні чи країні призначення, відповідно до чинного права. WhatsApp, Telegram, Facebook і зовнішні сайти мають власні політики. GPS не потрібний для звичайного перегляду; для таксі у Telegram геолокація надається лише за вашим вибором."
      ],
      [
        "Cookies і аналітика",
        "Cookies та локальне сховище можуть забезпечувати вхід, вибір мови і продовження розмови. Vercel Analytics вимірює використання та продуктивність. Керувати cookies можна у браузері; блокування необхідних cookies може завадити роботі сервісу. Ця політика не є загальною згодою на стеження чи рекламу."
      ],
      [
        "Зберігання та безпека",
        "Строк залежить від потреб опрацювання, документування, юридичних обов’язків і спорів; фіксований строк автоматичного видалення тут не гарантується. Застосовуються заходи безпеки й контролю доступу без гарантії абсолютного захисту. Якщо використовується зовнішній платіжний сервіс, він обробляє платіжні дані за власними умовами; не надсилайте їх у чаті або формі звернення."
      ],
      [
        "Ваші права",
        "За чинним ізраїльським правом, зокрема статтями 13 і 14 Закону про захист приватності та їх винятками, можна просити доступ і виправлення неточних, неповних, незрозумілих чи застарілих даних. Запити на видалення або припинення використання розглядаються з урахуванням обов’язків зберігання; видалення не є безумовним. Можлива пропорційна перевірка особи. Пишіть на ofer.delkom@gmail.com з темою «Запит щодо приватності UMAN2GO», спочатку без чутливих документів."
      ],
      [
        "Реклама та зміни",
        "Звернення, реєстрація чи скасування не є згодою на рекламу. Сервісні повідомлення стосуються вашого запиту. Маркетинг здійснюється за законом із можливістю відмови. Істотна зміна цілей потребує повідомлення та згоди, де вона необхідна. Обов’язкові права за законом мають перевагу."
      ]
    ]
  }
};
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (policies[locale] ?? policies.en).title };
}
export default async function PrivacyPage() {
  const locale = await getLocale();
  const policy = policies[locale] ?? policies.en;
  return <Section><article className="mx-auto max-w-3xl space-y-6 leading-8">
    <h1 className="font-display text-3xl font-extrabold text-brand-navy">{policy.title}</h1>
    <p className="text-sm text-foreground/70">{policy.updated}</p>
    {policy.sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-bold text-brand-navy">{title}</h2><p className="mt-2 whitespace-pre-line">{text}</p></section>)}
    <p><a className="underline underline-offset-4" href="mailto:ofer.delkom@gmail.com">ofer.delkom@gmail.com</a> · <a className="underline underline-offset-4" href="tel:+972533329778"><bdi dir="ltr">053-332-9778</bdi></a></p>
    <Link className="underline underline-offset-4" href="/contact">{({he:"צור קשר",en:"Contact",fr:"Contact",uk:"Контакти"} as Record<string,string>)[locale] ?? "Contact"}</Link>
  </article></Section>;
}
