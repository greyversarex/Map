-- Экспорт данных для развертывания на Timeweb
-- Создайте таблицу locations и выполните этот скрипт

-- Создание таблицы locations
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  video_url TEXT,
  location_type TEXT DEFAULT 'kmz',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Вставка данных
INSERT INTO locations (name, description, lat, lng, image_url, video_url, location_type) VALUES
-- КМЗ (Головное управление)
('Dushanbe Flagpole', 'One of the tallest flagpoles in the world, located in the capital city of Dushanbe.', 38.5737, 68.7864, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Dushanbe_flagpole.jpg/1200px-Dushanbe_flagpole.jpg', NULL, 'kmz'),
('Pamir Highway', 'A scenic high-altitude road traversing the Pamir Mountains.', 38.4127, 73.993, 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Pamir_Highway_M41.jpg/1200px-Pamir_Highway_M41.jpg', NULL, 'kmz'),
('Iskanderkul Lake', 'A stunning mountain lake named after Alexander the Great.', 39.0769, 68.3697, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Iskanderkul.jpg/1200px-Iskanderkul.jpg', NULL, 'kmz'),

-- Шуъбахо (Филиалы)
('Шуъбаи Душанбе', 'Филиал КМЗ в городе Душанбе', 38.5598, 68.787, NULL, NULL, 'branch'),
('Шуъбаи Кӯлоб', 'Филиал КМЗ в городе Кулоб', 37.9069, 69.7846, NULL, NULL, 'branch'),
('Шуъбаи Ҳисор', 'Филиал КМЗ в городе Хисор', 38.5261, 68.5512, NULL, NULL, 'branch'),
('Шуъбаи Хуҷанд', 'Филиал КМЗ в городе Худжанд', 40.2826, 69.6221, NULL, NULL, 'branch'),
('Шуъбаи Конибодом', 'Филиал КМЗ в городе Конибодом', 40.2942, 70.4298, NULL, NULL, 'branch'),

-- Мохипарвари (Рыбоводство)
('Моҳипарварии Хуҷанд', 'Рыбоводческое хозяйство в Худжанде', 40.2956, 69.5981, NULL, NULL, 'fishery'),
('Моҳипарварии Қайроққум', 'Рыбоводческое хозяйство у Кайраккумского водохранилища', 40.2345, 69.8012, NULL, NULL, 'fishery'),

-- Нихолхона (Питомники)
('Ниҳолхонаи Ваҳдат', 'Питомник в городе Вахдат', 38.5511, 69.0164, NULL, NULL, 'nursery'),
('Ниҳолхонаи Шаҳринав', 'Питомник в Шахринавском районе', 38.5672, 68.3244, NULL, NULL, 'nursery'),
('Ниҳолхонаи Ҳисор', 'Питомник в Хисорском районе', 38.5115, 68.5189, NULL, NULL, 'nursery'),
('Ниҳолхонаи Дангара', 'Питомник в Дангаринском районе', 38.0956, 69.3327, NULL, NULL, 'nursery'),
('Ниҳолхонаи Бохтар', 'Питомник в городе Бохтар', 37.8367, 68.7743, NULL, NULL, 'nursery'),
('Ниҳолхонаи Панҷакент', 'Питомник в Панджакенте', 39.4943, 67.6067, NULL, NULL, 'nursery'),

-- Мамнунгох (Заповедники)
('Мамнунгоҳи Шаҳритус', 'Заповедник в Шахритусском районе', 37.2622, 68.1489, NULL, NULL, 'reserve'),
('Мамнунгоҳи Исфара', 'Заповедник в Исфаринском районе', 40.1263, 70.6267, NULL, NULL, 'reserve'),
('Мамнунгоҳи Нуробод', 'Заповедник в Нурободском районе', 38.9745, 69.2889, NULL, NULL, 'reserve'),
('Мамнунгоҳи Ромит', 'Заповедник Ромитского ущелья', 38.7333, 69.25, NULL, NULL, 'reserve'),

-- Пиряххо (Ледники)
('Пиряхи Федченко', 'Ледник Федченко - крупнейший ледник Памира и один из самых длинных ледников в мире', 38.8333, 72.25, NULL, NULL, 'glacier');

-- Таблица сессий для аутентификации
CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
