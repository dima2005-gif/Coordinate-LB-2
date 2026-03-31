# Величко Дмитро ІПЗ 4-02

# Лабораторна робота №2

## Розробка додатку для візуалізації вимірювань радару
### Мета
Розробити додаток, який зчитує дані з емульованої вимірювальної частини радару, наданої у вигляді Docker image, та відображає задетектовані цілі на графіку в полярних координатах.

## Передумови
### Завантаження та запуск емулятора вимірювальної частини радару
Завантажемо Docker image наступною командою:
```
docker pull iperekrestov/university:radar-emulation-service
```

Далі запустимо контейнер наступною командою:
```
docker run --name radar-emulator -p 4000:4000 iperekrestov/university:radar-emulation-service
```

### Результат

<img width="1280" height="720" alt="изображение" src="https://github.com/user-attachments/assets/f7c47e33-8e9b-439c-8fe0-0f25d2710741" />

### LazyDocker

Для зручного управління контейнером використовувався LazyDocker — TUI-інструмент для роботи з Docker без Desktop.

<img width="1280" height="720" alt="изображение" src="https://github.com/user-attachments/assets/9e17f421-9691-442c-9c92-e044ccf329b6" />

### Формат даних WebSocket

Сервер надсилає JSON-повідомлення з наступною структурою:

```
{
  "scanAngle": 90,
  "pulseDuration": 1,
  "echoResponses": [
    {
      "time": 0.000012,
      "power": 0.05
    }
  ]
}
```

- scanAngle — поточний кут сканування (0–360°)
- pulseDuration — тривалість імпульсу (мкс)
- echoResponses.time — час поширення сигналу (с)
- echoResponses.power — потужність відбитого сигналу (0–1)

## Реалізація застосунку

Почнемо зі структури 

<img width="325" height="288" alt="изображение" src="https://github.com/user-attachments/assets/6523ce83-02cc-4c7a-a37c-b8fb3fdf4b8f" />

- app.js - передає дані на графік
- api.js - відправляє HTTP-запит
- chart.js - візуалізація радару
- websocket.js - файл для з'єднання з портом
- style.css - стилі сайту
- index.html - структура сайту

Розглянемо запит у файлі ```api.js```

<img width="860" height="728" alt="изображение" src="https://github.com/user-attachments/assets/0232a2a4-5091-4222-84be-b1d1a98017c4" />

Функція ```applyConfig()``` формує об'єкт з 3 параметрів, зчитуючи значення через ```getElementById```. Після цього надсилає асинхроний запит на адресу ```http://localhost:4000/config``` з тілом у формаиі JSON. А далі відображення повідомлення в залежності від результату запиту.

```chart.js```

<img width="852" height="478" alt="изображение" src="https://github.com/user-attachments/assets/719c1d96-6ab4-4f61-ac88-ae5f35752f25" />

- ```Plotly.newPlot``` створює полярний графік з трьома трейсами з трьома кольорами. 
- ```calcDistance(time)``` реалізує формулу розрахунку відстані до цілі.
- ```powerToTraceIdx(power)``` визначає який трейс буде залежності від потужності відбитого сигналу
  - ```power>0,7``` - червоний
  - ```power>0,3``` - жовтий
  - інакше зелений


### Результати роботи
## Головний інтерфейс

<img width="1862" height="965" alt="изображение" src="https://github.com/user-attachments/assets/a8d8fdbe-c8f8-49d3-a55a-f937f806f6fe" />


## Після деякого часу

<img width="1280" height="660" alt="изображение" src="https://github.com/user-attachments/assets/995f3b86-71d4-42d6-af52-024732c3867c" />


## У реальному часі

https://github.com/user-attachments/assets/e62ee176-6494-4cdc-888e-8dbd43120d36

### Висновок
В ході лабораторної роботи було розроблено веб-додаток для візуалізації даних емульованого радару. Додаток коректно обробляє потік даних у реальному часі та наочно відображає рух цілей у полярних координатах.
