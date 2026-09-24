"""Ride text translation billed to LingoBridge's existing Google project.

Common phrases remain local. Free text uses a server-only key when configured.
No automatic paid retry; failures keep the exact original. Voice/photos excluded.
"""
import json
import html
import os
import re
import unicodedata
import urllib.request

LANGS = ('he', 'en', 'ru', 'uk')
LABELS = ('תרגום ביטוי נסיעה · חינם', 'Ride phrase translation · Free',
          'Перевод фразы поездки · Бесплатно', 'Переклад фрази поїздки · Безкоштовно')
ORIGINAL = ('מקור', 'Original', 'Оригинал', 'Оригінал')
FULL_LABELS = ('תרגום אוטומטי · LingoBridge', 'Automatic translation · LingoBridge', 'Автоперевод · LingoBridge', 'Автопереклад · LingoBridge')
UNAVAILABLE = ('התרגום אינו זמין; ההודעה המקורית מוצגת.', 'Translation unavailable; original message shown.', 'Перевод недоступен; показан оригинал.', 'Переклад недоступний; показано оригінал.')
FULL_NOTICE = (
    'תרגום הודעות עד 1500 תווים באמצעות Google, על חשבון LingoBridge וללא חיוב לנהג או לנוסע. המקור נשמר. הודעות ארוכות, קול ותמונות נשלחים במקור.',
    'Messages up to 1500 characters are translated by Google, paid by LingoBridge, at no charge to drivers or passengers. Originals are kept. Longer messages, voice and photos stay in the original.',
    'Сообщения до 1500 символов переводятся через Google за счёт LingoBridge, без оплаты водителем или пассажиром. Оригинал сохраняется. Более длинные сообщения, голос и фото — в оригинале.',
    'Повідомлення до 1500 символів перекладаються через Google коштом LingoBridge, без оплати водієм чи пасажиром. Оригінал зберігається. Довші повідомлення, голос і фото — в оригіналі.',
)
NOTICE = (
    'תרגום חינם לביטויי נסיעה נפוצים בלבד, לפי שפת הנמען. טקסט אחר, קול ותמונות נשלחים במקור.',
    'Free translation of common ride phrases only, into the recipient’s language. Other text, voice and photos stay in the original.',
    'Бесплатный перевод только типовых фраз поездки на язык получателя. Другой текст, голос и фото — в оригинале.',
    'Безкоштовний переклад лише типових фраз поїздки мовою одержувача. Інший текст, голос і фото — в оригіналі.',
)
PHRASES = (
    ('אני בדרך', 'I am on my way', 'Я в пути', 'Я в дорозі'),
    ('הגעתי', 'I have arrived', 'Я прибыл', 'Я прибув'),
    ('אני מחכה בכניסה למלון', 'I am waiting at the hotel entrance', 'Я жду у входа в отель', 'Я чекаю біля входу в готель'),
    ('איפה אתה?', 'Where are you?', 'Где вы?', 'Де ви?'),
    ('כמה זמן עד ההגעה?', 'How long until you arrive?', 'Через сколько вы приедете?', 'Через скільки ви приїдете?'),
    ('נא לשלוח מיקום', 'Please send your location', 'Пришлите геопозицию', 'Надішліть геопозицію'),
    ('אני לא מוצא את המכונית', 'I cannot find the car', 'Я не могу найти машину', 'Я не можу знайти машину'),
    ('מה מספר הרכב?', 'What is the license plate number?', 'Какой номер машины?', 'Який номер машини?'),
    ('מה צבע המכונית?', 'What color is the car?', 'Какого цвета машина?', 'Якого кольору машина?'),
    ('המכונית אדומה', 'The car is red', 'Машина красная', 'Машина червона'),
    ('המכונית לבנה', 'The car is white', 'Машина белая', 'Машина біла'),
    ('המכונית שחורה', 'The car is black', 'Машина чёрная', 'Машина чорна'),
    ('מכונית נוספת', 'Another car', 'Другая машина', 'Інша машина'),
    ('תודה', 'Thank you', 'Спасибо', 'Дякую'),
    ('נא להמתין', 'Please wait', 'Пожалуйста, подождите', 'Будь ласка, зачекайте'),
    ('אני יוצא עכשיו', 'I am coming out now', 'Я сейчас выхожу', 'Я зараз виходжу'),
)


def normalize(text):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', text).strip()).casefold().rstrip('.!?؟')


INDEX = {normalize(text): (row, lang) for row in PHRASES for lang, text in zip(LANGS, row)}


def translate(text, target):
    match = INDEX.get(normalize(text))
    if target not in LANGS or not match or match[1] == target:
        return None
    return match[0][LANGS.index(target)]


def configured():
    return bool(os.getenv('LINGOBRIDGE_GOOGLE_TRANSLATION_API_KEY', '').strip())


def notice(lang):
    return (FULL_NOTICE if configured() else NOTICE)[LANGS.index(lang)]


ENTITY = re.compile(r'https?://\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?=\w*\d)(?=\w*[^\W\d_])\w+\b|\+?\d[\d.,:/%+()\-]*(?:\s\d[\d.,:/%+()\-]*)*')


def protect(text):
    if '⟦LB' in text:
        raise ValueError('Reserved marker')
    values = []
    def replace(match):
        values.append(match.group())
        return '⟦LB' + str(len(values) - 1) + '⟧'
    return ENTITY.sub(replace, text), values


def restore(text, values):
    if not isinstance(text, str) or not text.strip() or len(text) > 10000:
        raise ValueError('Invalid translation')
    for i in range(len(values)):
        if text.count('⟦LB' + str(i) + '⟧') != 1:
            raise ValueError('Protected entity changed')
    remainder = re.sub(r'⟦LB(\d+)⟧', '', text)
    if any(c.isdigit() for c in remainder) or '⟦LB' in remainder:
        raise ValueError('Unexpected number or marker')
    if any(int(i) >= len(values) for i in re.findall(r'⟦LB(\d+)⟧', text)):
        raise ValueError('Unexpected entity')
    return re.sub(r'⟦LB(\d+)⟧', lambda m: values[int(m[1])], text).strip()


def google_translate(text, target):
    req = urllib.request.Request('https://translation.googleapis.com/language/translate/v2',
        data=json.dumps({'q': text, 'target': target, 'format': 'text', 'model': 'nmt'}).encode(),
        headers={'Content-Type': 'application/json', 'X-Goog-Api-Key': os.environ['LINGOBRIDGE_GOOGLE_TRANSLATION_API_KEY']}, method='POST')
    with urllib.request.urlopen(req, timeout=4) as response:
        value = json.load(response)['data']['translations'][0]['translatedText']
    return html.unescape(value)


def prepare(db, row, persist=None, provider=None):
    payload = json.loads(row['payload'])
    job = payload.pop('_translation', None)
    if not job:
        return payload
    source, prefix, target = job['source'], job['prefix'], job['target']
    translated = translate(source, target)
    paid = configured() and not translated and target in LANGS and len(source) <= 1500
    # Save original without the job BEFORE any paid call. Interrupted calls never repeat.
    if paid:
        i = LANGS.index(target)
        fallback = prefix + '\n' + UNAVAILABLE[i] + '\n' + source
        if len(fallback.encode('utf-16-le')) // 2 <= 4096:
            payload['text'] = fallback
    db.execute('UPDATE outbox SET payload=? WHERE id=?', (json.dumps(payload, ensure_ascii=False), row['id']))
    if paid:
        db.execute('CREATE TABLE IF NOT EXISTS translation_attempts (outbox_id INTEGER PRIMARY KEY, created_at TEXT DEFAULT CURRENT_TIMESTAMP, characters INTEGER NOT NULL, target TEXT NOT NULL, state TEXT NOT NULL)')
        try:
            protected, values = protect(source)
        except ValueError:
            return payload
        db.execute('INSERT INTO translation_attempts(outbox_id,characters,target,state) VALUES (?,?,?,?)', (row['id'], len(protected), target, 'attempted'))
        if persist:
            persist()  # Fail closed: no provider call if the reservation cannot be saved.
        try:
            translated = restore((provider or google_translate)(protected, target), values)
        except Exception:
            # Do not log private text, API keys, URLs containing keys, or response bodies.
            db.execute("UPDATE translation_attempts SET state='failed' WHERE outbox_id=?", (row['id'],))
            translated = None
    if translated:
        i = LANGS.index(target)
        text = prefix + '\n' + (FULL_LABELS if paid else LABELS)[i] + '\n' + translated + '\n\n' + ORIGINAL[i] + '\n' + source
        if len(text.encode('utf-16-le')) // 2 <= 4096:
            payload['text'] = text
        if paid:
            db.execute('UPDATE translation_attempts SET state=? WHERE outbox_id=?', ('complete' if payload['text'] == text else 'too_long', row['id']))
    db.execute('UPDATE outbox SET payload=? WHERE id=?', (json.dumps(payload, ensure_ascii=False), row['id']))
    if paid and persist:
        persist()
    return payload
