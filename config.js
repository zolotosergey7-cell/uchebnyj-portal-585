/* ===== Настройки Учебного портала 585 =====
   api — адрес веб-приложения Google Apps Script (…/exec). Пусто = результаты хранятся только в браузере (режим проверки).
   Этапы идут по порядку: следующий открывается, когда сданы все курсы предыдущего.
   sequential: true — курсы внутри этапа открываются строго по очереди.
   passOnComplete: true — курс без теста засчитывается, когда досмотрен до конца. */
window.PORTAL = {
  api: "",
  stages: [
    { title: "Изделие",          intro: "Начинаем с основы: из чего сделаны украшения. Оба курса открыты сразу, проходи в любом порядке.", sequential: false, courses: ["metals", "stones"] },
    { title: "Техника продаж",   intro: "Пять шагов продажи — от первого «здравствуйте» до чека. Курсы открываются строго по очереди.",       sequential: true,  courses: ["greeting", "needs", "presentation", "objections", "closing"] },
    { title: "Сервис и защита",  intro: "Финальный этап: безопасность магазина, кредит и бонусная программа. Проходи в любом порядке.",          sequential: false, courses: ["safe-shop", "credit", "bonus"] }
  ],
  courses: {
    "metals":       { title: "Металлы",                            meta: "Интерактив · тест",  launch: "courses/metals/index_lms.html",        mastery: 80, desc: "Из чего сделаны украшения и как о металлах рассказать покупателю." },
    "stones":       { title: "Камни",                              meta: "Интерактив · тест",  launch: "courses/stones/index_lms.html",        mastery: 80, desc: "Вставки в изделиях: как их различать и как о них говорить." },
    "greeting":     { title: "Приветствие и установление контакта", meta: "Видео · тест",       launch: "courses/greeting/res/index.html",      desc: "Первые секунды с покупателем: как поздороваться и расположить к себе." },
    "needs":        { title: "Выявление потребностей",             meta: "Видео · тест",       launch: "courses/needs/res/index.html",         desc: "Какие вопросы задать, чтобы понять, что на самом деле ищет покупатель." },
    "presentation": { title: "Презентация",                        meta: "Видео · тест",       launch: "courses/presentation/res/index.html",  desc: "Как показать изделие так, чтобы его захотелось примерить." },
    "objections":   { title: "Работа с возражениями",              meta: "Видео · тест",       launch: "courses/objections/res/index.html",    desc: "«Дорого», «подумаю», «посмотрю ещё» — что отвечать." },
    "closing":      { title: "Завершение сделки",                  meta: "Лонгрид · тест",     launch: "courses/closing/res/index.html",       desc: "Как довести продажу до покупки и попрощаться так, чтобы вернулись." },
    "safe-shop":    { title: "Безопасный магазин 2.0",             meta: "Лонгрид · тест",     launch: "courses/safe-shop/res/index.html",     desc: "Полный гид по защите магазина, товара и себя." },
    "credit":       { title: "Кредит",                             meta: "Лонгрид · тест",     launch: "courses/credit/res/index.html",        desc: "Как оформить покупку в кредит и рассказать об этой возможности." },
    "bonus":        { title: "Гид по бонусам",                     meta: "Видео-гид · без теста", launch: "courses/bonus/index_lms.html",      passOnComplete: true, desc: "Бонусная программа: как она работает и как о ней рассказывать." }
  }
};
