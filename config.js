/* ===== Настройки Учебного портала 585 =====
   api — адрес веб-приложения Google Apps Script (…/exec). Пусто = результаты хранятся только в браузере (режим проверки).
   Траектории — вкладки «Продавец» / «Товаровед». Этапы идут по порядку: следующий открывается, когда сданы все курсы предыдущего.
   sequential: true — курсы внутри этапа открываются строго по очереди.
   passOnComplete: true — курс без теста засчитывается, когда досмотрен до конца. */
window.PORTAL = {
  api: "https://script.google.com/macros/s/AKfycbxFQGbbEY3wWCABM11sQr7D6z84bXH-wYIDl6IL4VLNsDv73BYKKUOpYHeAKwPG2dBQAA/exec",
  /* Траектории (вкладки). Любой сотрудник может проходить любую траекторию; общие курсы засчитываются в обеих. */
  tracks: [
    { id: "prodavec", tab: "Продавец", place: "Ювелирный магазин",
      kick: "Траектория продавца · 3 этапа · 10 курсов",
      lead: "Добро пожаловать в команду <b>585 GOLD</b>. Здесь всё, что нужно знать продавцу в первые недели: изделия, техника продаж и сервис. Проходи курсы по порядку — в конце каждого короткий тест.",
      sticker: "Начнём с металлов и камней?",
      stages: [
        { title: "Изделие",          intro: "Начинаем с основы: из чего сделаны украшения. Оба курса открыты сразу, проходи в любом порядке.", sequential: false, courses: ["metals", "stones"] },
        { title: "Техника продаж",   intro: "Пять шагов продажи — от первого «здравствуйте» до чека. Курсы открываются строго по очереди.",       sequential: true,  courses: ["greeting", "needs", "presentation", "objections", "closing"] },
        { title: "Сервис и защита",  intro: "Финальный этап: безопасность магазина, кредит и бонусная программа. Проходи в любом порядке.",          sequential: false, courses: ["safe-shop", "credit", "bonus"] }
      ] },
    { id: "tovaroved", tab: "Товаровед", place: "Ломбард",
      kick: "Траектория товароведа · 3 этапа · 7 курсов",
      lead: "Добро пожаловать в <b>Ломбард 585</b>. Здесь всё, что нужно товароведу на старте: основы работы ломбарда, приём и оценка залога, сервис для клиента. Проходи курсы по порядку.",
      sticker: "Начнём с основ ломбарда?",
      stages: [
        { title: "Основы ломбарда",  intro: "Как устроен ломбард и какие правила безопасности действуют на объекте. Оба курса открыты сразу.",       sequential: false, courses: ["pawn-intro", "pawn-security"] },
        { title: "Приём залога",     intro: "От первого залога до оформления заявки и самостоятельной оценки техники. Курсы открываются по очереди.", sequential: true,  courses: ["pawn-first", "pawn-request", "pawn-trainer"] },
        { title: "Сервис",           intro: "Клиентский опыт и итоговый блок обучения. Проходи в любом порядке.",                                    sequential: false, courses: ["pawn-cx", "pawn-ld"] }
      ] }
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
    "bonus":        { title: "Гид по бонусам",                     meta: "Видео-гид · без теста", launch: "courses/bonus/index_lms.html",      passOnComplete: true, desc: "Бонусная программа: как она работает и как о ней рассказывать." },
    "pawn-intro":    { title: "Курс по ломбардам (для новичка)",   meta: "Интерактив",          launch: "courses/pawn-intro/res/index.html",    desc: "Как работает ломбард: залог, займ, выкуп и роль товароведа." },
    "pawn-security": { title: "Регламенты безопасности в ломбардах", meta: "Интерактив",        launch: "courses/pawn-security/res/index.html", desc: "Правила безопасности на объекте: что делать каждый день и в нештатной ситуации." },
    "pawn-first":    { title: "Первый залог. Приём и оценка техники", meta: "Интерактив · тест", launch: "courses/pawn-first/585-tech-course/index.html", desc: "Пошагово: как принять технику в залог и оценить её." },
    "pawn-request":  { title: "Создание заявки и проверка техники", meta: "Видео",             launch: "courses/pawn-request/res/index.html",  passOnComplete: true, desc: "Как оформить заявку в системе и проверить технику перед приёмом." },
    "pawn-trainer":  { title: "Тренажёр «Оценка техники»",          meta: "Тренажёр · оценка",  launch: "courses/pawn-trainer/tech_trainer.html", desc: "Практика: оцени технику сам и проверь себя." },
    "pawn-cx":       { title: "Управление клиентским опытом",       meta: "Лонгрид",           launch: "courses/pawn-cx/res/index.html",       passOnComplete: true, desc: "Сервис как залог лояльности: как сделать так, чтобы клиент вернулся." },
    "pawn-ld":       { title: "Блок обучения ЛД",                   meta: "Интерактив",        launch: "courses/pawn-ld/res/index.html",       desc: "Слайд-курс с видео по работе ломбарда." }
  }
};
