# MyMediaList - Backend 🖥️

Este proyecto constituye el backend de MyMediaList, desarrollado como Trabajo de Fin de Grado del Ciclo Formativo de Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM).

## 🔗 Enlaces del Proyecto

### Aplicación en Producción

- 🌐 [MyMediaList Web](https://mymedialist-henna.vercel.app/) - Aplicación web en producción
- 🖥️ [API Backend](https://my-media-list-backend.onrender.com/) - API REST desplegada en Render

### Repositorios

- [Frontend Repository](https://github.com/det00/mymedialist-web) - Desarrollado por mi compañero de equipo

## 📋 Descripción

Este es el servidor backend que proporciona la API para MyMediaList, una aplicación que permite:

- Gestionar bibliotecas multimedia personales
- Hacer seguimiento de series, películas y otros contenidos
- Sistema de calificación y reseñas
- Gestión de listas personalizadas
- Sistema de interacción entre usuarios

### 🌟 Características Principales

- **Autenticación Segura**: Implementación de JWT (JSON Web Tokens) para gestión de sesiones
- **API RESTful**: Endpoints bien estructurados siguiendo las mejores prácticas REST
- **Base de Datos Relacional**: Diseño optimizado de esquema en MySQL
- **Documentación Automática**: Integración con Swagger/OpenAPI
- **Validación de Datos**: Sistema robusto de validación usando class-validator
- **Manejo de Errores**: Sistema centralizado de gestión de excepciones
- **Logs**: Sistema de logging para monitorización y debugging

## 🛠️ Tecnologías Utilizadas

### Backend Core

- Node.js
- NestJS 11.x
- TypeScript
- TypeORM
- MySQL

### Seguridad

- JWT (@nestjs/jwt)
- bcryptjs
- class-validator
- class-transformer

### Testing

- Jest
- SuperTest
- @nestjs/testing

### Documentación y Calidad

- Swagger/OpenAPI (@nestjs/swagger)
- ESLint
- Prettier
- TypeScript

### Herramientas de Desarrollo

- Visual Studio Code
- Git
- Docker
- Postman

## 🏗️ Arquitectura

El proyecto sigue la arquitectura modular de NestJS:

1. **Módulos**: Organización modular del código
2. **Controladores**: Manejo de peticiones HTTP
3. **Servicios**: Lógica de negocio
4. **Entidades**: Modelos de base de datos
5. **DTOs**: Objetos de transferencia de datos
6. **Guards**: Protección de rutas
7. **Pipes**: Validación y transformación de datos
8. **Interceptors**: Modificación de respuestas/peticiones

## 🚀 Instalación

### Prerrequisitos

- Node.js 14.x o superior
- NestJS 11.x
- MySQL 8.0+
- Docker (opcional)

### Pasos de Instalación

1. Clona el repositorio:

```bash
git clone [URL-del-repositorio]
```

2. Configura la base de datos MySQL y actualiza `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/mymedialist
spring.datasource.username=tu_usuario
spring.datasource.password=tu_contraseña
```

3. Ejecuta la aplicación:

```bash
./mvnw spring-boot:run
```

4. La API estará disponible en `http://localhost:8080`

### Usando Docker

```bash
docker-compose up -d
```

## 📚 Documentación

La documentación de la API está disponible en:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- API Docs: `http://localhost:8080/v3/api-docs`

### Endpoints Principales

- `POST /api/auth/login`: Autenticación de usuarios
- `GET /api/media`: Obtener lista de contenido multimedia
- `POST /api/lists`: Crear nueva lista personalizada
- `PUT /api/reviews`: Actualizar reseñas
- `GET /api/users/{id}/profile`: Obtener perfil de usuario

## 🧪 Testing

Ejecutar tests unitarios:

```bash
./mvnw test
```

Ejecutar tests de integración:

```bash
./mvnw verify
```
