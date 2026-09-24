"""Offline exact phrase translation: no provider, credentials or translation fees.

Limited ride phrasebook, not a general-purpose LingoBridge integration.
Unrecognized messages are delivered unchanged; no partial message translation.
"""
import json
import re
import unicodedata

LANGS = ('he', 'en', 'ru', 'uk')
LABELS = ('תרגום ביטוי נסיעה · חינם', 'Ride phrase translation · Free',
          'Перевод фразы поездки · Бесплатно', 'Переклад фрази поїздки · Безкоштовно')
ORIGINAL = ('מקור', 'Original', 'Оригинал', 'Оригінал')
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


def prepare(db, row):
    payload = json.loads(row['payload'])
    job = payload.pop('_translation', None)
    if not job:
        return payload
    source, prefix, target = job['source'], job['prefix'], job['target']
    translated = translate(source, target)
    if translated:
        i = LANGS.index(target)
        text = prefix + '\n' + LABELS[i] + '\n' + translated + '\n\n' + ORIGINAL[i] + '\n' + source
        if len(text.encode('utf-16-le')) // 2 <= 4096:
            payload['text'] = text
    db.execute('UPDATE outbox SET payload=? WHERE id=?', (json.dumps(payload, ensure_ascii=False), row['id']))
    return payload
