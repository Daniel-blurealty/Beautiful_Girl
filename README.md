# Beautiful Girl — E-commerce (Node.js + MySQL + JS + HTML)
Proyecto de tienda en línea con backend en Node.js/Express, base de datos MySQL y frontend HTML + CSS + JavaScript modular servido estáticamente por Express. Incluye autenticación con sesiones, roles (admin / customer), catálogo con filtros, carrito y pedidos, panel de administración, subida de imágenes y favoritos para usuarios logueados.

## Rutas para descargar herramientas necesarias (si no las tiene)
[MySQL workbench](https://dev.mysql.com/downloads/workbench/) (para windows)<br/>
[MySQL 8.4.6 LTS](https://dev.mysql.com/downloads/mysql/) (para windows) <br/>
[Node.js v22.19.0](https://nodejs.org/en/download) <br/>
[git](https://git-scm.com/downloads)

_Si no tienen nada de esto descargado, solo explico como instalar y utilizar MySQL, los otros dos busquen el tutorial rapido en google que no tiene mucha ciencia_

## Tabla de contenidos
- Arquitectura [Guia](#arquitectura).
- Tecnologías y herramientas [Guia](#tecnologías-y-herramientas).
- Requisitos [Guia](#requisitos).
- Configuración .env [Guia](#configuración-env).
- Base de datos [Guia](#base-de-datos).
- Instalación y ejecución [Guia](#instalación-y-ejecución).
- Funcionalidades [Guia](#funcionalidades).
- API (resumen) [Guia](#api-resumen).
- Panel de administración [Guia](#panel-de-administracion).
- Favoritos [Guia](#favoritos).
- Resolución de problemas [Guia](#resolucion-de-problemas).

### Arquitectura
- **Backend/API**: server/ (Express + MySQL).
- **Frontend**: public/ estático (HTML, CSS, JS modular).
- **Sesiones**: express-session (cookie de sesión, no JWT).
- **Uploads**: imágenes de productos con multer, servidas desde /uploads.

### Tecnologías y herramientas
**Backend**
- Node.js 18+ / 20+
- Express (ruteo, estáticos, middlewares)
- express-session (autenticación por sesiones)
- multer (subida de imágenes)
- mysql2 (driver de MySQL)
- morgan (logs de peticiones)
- dotenv (variables de entorno)

**Base de datos**
- MySQL 8
- MySQL Workbench (modelado y administración)

**Frontend**
- **HTML5 + CSS3** (tema rosado / UI liviana)
- **Vanilla JavaScript** modular (sin frameworks)
- **Router por hash** #/ (home), #/categoria/:slug, #/buscar/:q, #/producto/:id, #/favoritos
- **Dialogs** nativos para login/registro/recibo

### Requisitos
- Node.js v18+ (recomendado v20+)
- npm o pnpm/yarn
- MySQL 8
- MySQL Workbench (opcional, recomendado)
- Git (opcional)

### Configuración (env)
Crear una archivo en la raiz, en dado caso que no exista `.env` (fuera de `public` y de `server`, debe quedar al nivel de estos.) y agregarle la siguiente data
```
PORT=4000
MYSQL_HOST=localhost
MYSQL_USER='root' <- (el nombre que le hayan puesto, en mi caso lo deje por defecto, es 'root')
MYSQL_PASSWORD=1234 <- (esta es la contrasena que tengan en MySQL, en mi caso es 1234)
MYSQL_DB=beautiful_girl_db <- (el nombre de la base de datos que uds tenga, en mi caso es beautiful_girl_db)
```

### Base de datos
**Los pasos para que creen la base de datos local y puedan usarla.**
- Descargar (si no lo tienen) MySQL y el MySQL workbench
- Configurar el espacio (dejar todo por default es mas facil)
- **Durante la instalación te pedirá**:
  - Contraseña para el usuario root → anótala, la vas a necesitar.
  - Puerto → deja el 3306 (por defecto).
- Luego de crear el 'usuario', ingresamos al MySQL workbench.
1. **Abrir MySQL Workbench**
   - Busca MySQL Workbench en el menú de tu sistema y ábrelo.
   - Verás un recuadro con la conexión por defecto a localhost:3306.
   - Haz click ahí, ingresa tu contraseña de root y ¡listo! ya entraste.
- Abrimos el nuevo servidor que creamos, vamos al tab llamado 'schemas'
3. Crear una base de datos
   - En la parte superior haz click en el ícono de hoja con un rayo (SQL Editor).
   - Se abrirá un panel para escribir comandos SQL.
   - Copia y ejecuta:
   ```
   CREATE DATABASE beautiful_girl;
   USE beautiful_girl;
   ```
   - Con eso ya tienes una base de datos llamada beautiful_girl lista para usar.
- Seleccionamos la base de datos que creamos (si todo salio bien, ya lo hiciste con el `USE beautiful_girl;`)
- Una vez dentro, vamos a crear los schemas


**Crear el schema:**
- Vamos a crear los schemas (las tablas) para poder utilizar nuestra base de datos.
- Solo debes copiar y pegarlo dentro del panel que les muestra la aplicacion de MySQL workbench. Una vez que lo hayas pegado, seleccionalo todo y dale click al `rayo/trueno` o apreta `ctrl + enter`

1. Users
```
CREATE TABLE `users` (
   `id` bigint unsigned NOT NULL AUTO_INCREMENT,
   `name` varchar(120) NOT NULL,
   `email` varchar(190) NOT NULL,
   `password_hash` varchar(255) NOT NULL,
   `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   UNIQUE KEY `email` (`email`),
   CONSTRAINT `chk_email` CHECK ((`email` <> _cp850''))
 ) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```
2. Categories
```
CREATE TABLE `categories` (
   `id` bigint unsigned NOT NULL AUTO_INCREMENT,
   `name` varchar(120) NOT NULL,
   `slug` varchar(160) NOT NULL,
   `description` varchar(500) DEFAULT NULL,
   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   UNIQUE KEY `slug` (`slug`),
   KEY `idx_categories_name` (`name`)
 ) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```
3. Products
```
CREATE TABLE `products` (
   `id` bigint unsigned NOT NULL AUTO_INCREMENT,
   `name` varchar(200) NOT NULL,
   `slug` varchar(220) NOT NULL,
   `description` text,
   `price` decimal(10,2) NOT NULL,
   `stock` int NOT NULL DEFAULT '0',
   `sku` varchar(64) DEFAULT NULL,
   `category_id` bigint unsigned DEFAULT NULL,
   `image_url` varchar(500) DEFAULT NULL,
   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   UNIQUE KEY `slug` (`slug`),
   UNIQUE KEY `sku` (`sku`),
   KEY `idx_products_name` (`name`),
   KEY `idx_products_category` (`category_id`),
   CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
   CONSTRAINT `chk_price_nonneg` CHECK ((`price` >= 0)),
   CONSTRAINT `chk_stock_nonneg` CHECK ((`stock` >= 0))
 ) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```
4. Orders
```
CREATE TABLE `orders` (
   `id` bigint unsigned NOT NULL AUTO_INCREMENT,
   `user_id` bigint unsigned NOT NULL,
   `status` enum('pending','paid','shipped','cancelled') NOT NULL DEFAULT 'pending',
   `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   KEY `idx_orders_user` (`user_id`),
   KEY `idx_orders_status` (`status`),
   CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
   CONSTRAINT `chk_total_nonneg` CHECK ((`total_amount` >= 0))
 ) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```
5. order_items
```
CREATE TABLE `order_items` (
   `id` bigint unsigned NOT NULL AUTO_INCREMENT,
   `order_id` bigint unsigned NOT NULL,
   `product_id` bigint unsigned NOT NULL,
   `quantity` int NOT NULL,
   `unit_price` decimal(10,2) NOT NULL,
   PRIMARY KEY (`id`),
   KEY `idx_order_items_order` (`order_id`),
   KEY `idx_order_items_product` (`product_id`),
   CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
   CONSTRAINT `chk_qty_pos` CHECK ((`quantity` > 0)),
   CONSTRAINT `chk_unit_price_nonneg` CHECK ((`unit_price` >= 0))
 ) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```
6. favorites
```
CREATE TABLE `favorites` (
   `user_id` bigint unsigned NOT NULL,
   `product_id` bigint unsigned NOT NULL,
   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`user_id`,`product_id`),
   KEY `idx_fav_user_created` (`user_id`,`created_at`),
   KEY `idx_fav_product` (`product_id`),
   CONSTRAINT `fk_fav_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

2. Crear usuario admin (si no lo generas vía registro y cambio de rol manual):

**registra un usuario desde la UI** y luego:
```
UPDATE users SET role='admin' WHERE email='tu_admin@example.com';
```
### Instalación y ejecución
```
# 1) Clonar e instalar dependencias
git clone <url-del-repo>
cd <carpeta>
npm install

# 2) Variables de entorno
cp .env.example .env
# edita .env con tus credenciales

# 3) Verifica MySQL corriendo y el schema creado

# 4) Carpeta de uploads (si no existe)
mkdir -p server/uploads

# 5) Levantar el servidor
# Opción A (si existe script dev/start en package.json)
npm run dev       # nodemon (desarrollo)
# o
npm start         # producción simple

# Opción B (directo con Node)
node server/index.mjs
# (si tu punto de entrada es otro: node server/app.mjs + un pequeño server.listen)
```
Luego abre: <br/>
`http://localhost:4000` → tienda <br/>
o <br/>
`http://localhost:4000/admin` → panel admin (protegido por rol)

### Funcionalidades
**Cliente**
- Home con lo más vendido por categoría y barra de categorías dinámica.
- Búsqueda con barra superior y vista de resultados.
- Detalle de producto con imagen grande, precio, descripción y agregar al carrito.
- Carrito con drawer lateral (cantidad, subtotal, quitar, pagar ahora).
- Pedidos: al pagar, se crea el pedido, se valida stock y se muestra recibo modal.
- Auth: diálogo de login/registro; estado persiste por cookie de sesión.
- Favoritos: corazón en cards; vista independiente #/favoritos.

**Admin**
- /admin (sólo rol admin):
- CRUD Productos (con subida de imagen, categoría, stock, precio).
- CRUD Categorías.
- Listado de Pedidos y cambio de estado.
- Protección: requireAdmin en endpoints y vista.
### API (resumen)
- **Prefijo base:** `/api`

**Auth**
- `POST /auth/register`— crea usuario.
- `POST /auth/`— login (email/password).
- `GET /auth/me`— usuario actual (requiere sesión).
- `POST /auth/logout`— logout.

**Categorías**
- `GET /categories`— lista con product_count.
- `POST /categories`— crear (admin).
- `PUT /categories/:id`— actualizar (admin).
- `DELETE /categories/:id`— eliminar (admin).

**Productos**
- `GET /products`— filtros: q, category (slug) o category_id, sort (new|price_asc|price_desc|name_asc|name_desc), page, limit.
- `GET /products/:id`- detalle del producto
- `POST /products`— multipart/form-data; name, price, stock, category_id, image.
- `PUT /products/:id`— también puede ser multipart/form-data (para reemplazar imagen).
- `DELETE /products/:id`

**Pedidos**
- `POST /orders`— crea pedido (requiere sesión).
- `GET /orders`— (admin) todos los pedidos.
- `PUT /orders/:id`— (admin) cambiar estado.

**Favoritos**
- `GET /favorites`— lista de productos favoritos del usuario.
- `POST /favorites`- guarda los productos en favoritos
- `DELETE /favorites/:id`- elimina los favoritos

### Panel de administración
- Panel solo permitido para los administradores
- Pueden crear, eliminar, editar:
  - Categorias
  - Productos
  - Pedidos
### Favoritos
- Tabla favorites (relación N:M materializada como PK compuesta).
En frontend:
- Botón 💖 en cada card (toggle).
  -  Vista dedicada #/favoritos (sección independiente, no mezcla con categorías).
  - Para salirse de la seccion de favoritos hay que clickear al boton `ver todos`
  - Requiere sesión; si no, abre el login y te retorna a #/.
