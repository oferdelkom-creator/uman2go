import type { Metadata } from "next";
import ApartmentOfferForm from "@/components/ApartmentOfferForm";

export const metadata: Metadata = {
  title: "Власникам квартир в Умані — 10–14 вересня 2026",
  description: "Шукаємо квартири біля могили рабі Нахмана. До $1000 за 4 ночі, залежно від квартири. Надішліть пропозицію UMAN2GO.",
  alternates: { canonical: "/uk/apartments-september" },
  robots: { index: false, follow: true },
};

export default function ApartmentCampaignPage() {
  return <div lang="uk" dir="ltr" className="bg-[#f7f4ed] text-[#142c39]">
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-[#8c4525]">UMAN2GO · Власникам квартир</p>
        <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">Ваша квартира в Умані.<br />Наші гості на 4 ночі.</h1>
        <p className="mt-6 text-xl">Плануєте поїздку з родиною? Запропонуйте нам свою квартиру на <strong>10–14 вересня 2026 року.</strong></p>
        <div className="my-7 rounded-3xl bg-[#142c39] p-7 text-white">
          <p className="text-sm uppercase tracking-wider">Бюджет за всю квартиру · за весь період</p>
          <p className="my-2 text-5xl font-extrabold">До $1000</p>
          <p>4 ночі · заїзд 10 вересня · виїзд 14 вересня</p>
          <p className="mt-3 text-sm text-white/75">Остаточна ціна залежить від розташування, стану та кількості спальних місць. Це не гарантія оплати чи бронювання.</p>
        </div>
        <h2 className="text-xl font-bold">Що для нас важливо</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5">
          <li>До 10 хвилин пішки до входу до могили рабі Нахмана; до 15 хвилин розглянемо додатково.</li>
          <li>Перевіряємо реальний пішохідний маршрут, сходи та можливі перекриття. Гості не користуватимуться автомобілем у свято.</li>
          <li>Чиста квартира, справні душ і туалет, вода, безпечні спальні місця та інформація про найближче укриття.</li>
          <li>Погодження власника на проживання наших гостей та узгоджена максимальна кількість людей.</li>
        </ul>
        <p className="mt-6 text-sm">Не потрібно виїжджати з квартири до перевірки та письмового погодження умов.</p>
      </div>
      <div id="offer" className="self-start rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold">Запропонувати квартиру</h2>
        <p className="mb-6 mt-2 text-sm">Без реєстрації. Залиште дані для відповіді електронною поштою.</p>
        <ApartmentOfferForm />
        <p className="mt-6 border-t pt-5 text-sm">Або напишіть безпосередньо: <a className="break-all font-bold underline" href="mailto:ofer.delkom@gmail.com?subject=UMAN2GO%20%E2%80%94%20%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D0%B0%2010%E2%80%9314%20%D0%B2%D0%B5%D1%80%D0%B5%D1%81%D0%BD%D1%8F">ofer.delkom@gmail.com</a>. Додайте адресу, фото або відео, кількість спальних місць і ціну за весь період.</p>
      </div>
    </section>
  </div>;
}
