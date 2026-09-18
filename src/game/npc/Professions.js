export const PROFESSIONS = Object.freeze({
  ENGINEER: "Engineer", MEDIC: "Medic", TECHNICIAN: "Technician",
  WORKER: "Worker", SECURITY: "Security", COOK: "Cook"
});

export const PROFESSION_BEHAVIOR = Object.freeze({
  Engineer: { workDuration: 5.5, task: "Обслуживает энергосистему" },
  Medic: { workDuration: 5, task: "Проверяет медицинское оборудование" },
  Technician: { workDuration: 5.5, task: "Диагностирует системы" },
  Worker: { workDuration: 4.5, task: "Перемещает грузы" },
  Security: { workDuration: 4, task: "Патрулирует сектор" },
  Cook: { workDuration: 5, task: "Готовит рацион" }
});

export const ACTIVITY_TASKS = Object.freeze({
  idle: "Отдыхает", walk: "Идёт к задаче", sit: "Сидит", chat: "Разговаривает"
});
