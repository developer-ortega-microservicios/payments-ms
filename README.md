# Payments Microservice

Microservicio de pagos hecho con **NestJS** y **TypeScript**, parte del proyecto del curso [NestJS + Microservicios](https://www.udemy.com/course/nestjs-microservicios/) (Udemy, DevTalles). Se integra con **Stripe** para crear sesiones de pago y recibir sus confirmaciones por **webhook**.

> Proyecto de práctica completado: este servicio forma parte de una tienda de 5 microservicios desplegada en **Google Kubernetes Engine (GKE)** con Helm. Ver el [launcher](https://github.com/developer-ortega-microservicios/products-launcher).

## Arquitectura

```
client-gateway ──NATS──→ orders-ms ──NATS──→ payments-ms ──→ Stripe
                                                  ▲              │
                                                  └── webhook ───┘
```

Repositorios relacionados en la organización [developer-ortega-microservicios](https://github.com/developer-ortega-microservicios).

## Funcionalidades

- Creación de sesiones de pago en Stripe (Checkout) a partir de una orden
- Recepción y validación de webhooks de Stripe (firma del evento)
- Notificación a `orders-ms` cuando un pago se confirma
- Comunicación con el resto de servicios por **NATS**
- Variables de entorno validadas con **Joi**

## Endpoints y mensajes

| Tipo | Ruta / patrón | Descripción |
|------|---------------|-------------|
| HTTP GET | `/` | Health check |
| HTTP POST | `/payments/create-payment-session` | Crea una sesión de Stripe Checkout |
| HTTP GET | `/payments/success` | Página a la que vuelve el cliente tras pagar |
| HTTP GET | `/payments/cancelled` | Página a la que vuelve el cliente si cancela |
| HTTP POST | `/payments/webhook` | Recibe los eventos de Stripe y valida su firma |
| NATS (mensaje) | `create.payment.session` | Lo usa `orders-ms` para pedir una sesión de pago |
| NATS (evento) | `payment.succeeded` | Se emite a `orders-ms` cuando el pago se confirma |

## Stack técnico

- **NestJS** + **TypeScript**
- **Stripe** (modo de pruebas)
- **NATS** (`@nestjs/microservices`)
- **Joi** y **class-validator**
- **Vitest**, **Oxlint** y **Prettier**

## Cómo correrlo localmente

1. Tener corriendo el servidor de NATS (ver el README del [client-gateway](https://github.com/developer-ortega-microservicios/client-gateway) o el [launcher](https://github.com/developer-ortega-microservicios/products-launcher)).

2. Clonar e instalar:
   ```bash
   git clone https://github.com/developer-ortega-microservicios/payments-ms.git
   cd payments-ms
   npm install
   ```
   Si npm falla con `Cannot read properties of null (reading 'edgesOut')`, usar `npm install --legacy-peer-deps`.

3. Crear un archivo `.env` en la raíz (usar `.env.example` como referencia). Las claves de Stripe se obtienen en el [panel de Stripe](https://dashboard.stripe.com/test/apikeys) y deben ser **de prueba** (`sk_test_...`):
   ```
   PORT=3003
   NATS_SERVERS=nats://localhost:4222
   STRIPE_SECRET=sk_test_...
   STRIPE_SUCCESS_URL=http://localhost:3003/payments/success
   STRIPE_CANCEL_URL=http://localhost:3003/payments/cancelled
   STRIPE_ENDPOINT_SECRET=whsec_...
   ```

4. Iniciar en modo desarrollo:
   ```bash
   npm run start:dev
   ```

## Despliegue

- **Imagen de producción:** `dockerfile.prod` (build multi-etapa sobre `node:22-alpine`).
- **Build y publicación:** `cloudbuild.yml` construye la imagen con Cloud Build y la sube a **Artifact Registry** (`image-registry/payments-ms`).
- **Kubernetes:** se despliega en GKE Autopilot con el chart de Helm `k8s/tienda-gke` del [launcher](https://github.com/developer-ortega-microservicios/products-launcher); se comunica con el resto de servicios por NATS dentro del clúster.
- **Secrets:** `STRIPE_SECRET` y `STRIPE_ENDPOINT_SECRET` llegan desde el secret de Kubernetes `payments-secrets`.
- **Webhook:** el Ingress expone `/payments/*`; en Stripe (modo de prueba) se registra `http://<IP-del-Ingress>/payments/webhook` con el evento `charge.succeeded` (el servicio lo procesa y avisa a `orders-ms`).

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servicio |
| `NATS_SERVERS` | Servidores de NATS, separados por coma |
| `STRIPE_SECRET` | Clave secreta de Stripe (modo de prueba) |
| `STRIPE_SUCCESS_URL` | URL a la que vuelve el cliente tras pagar |
| `STRIPE_CANCEL_URL` | URL a la que vuelve el cliente si cancela |
| `STRIPE_ENDPOINT_SECRET` | Secreto para validar la firma de los webhooks |

> **Nunca subas el `.env` ni las claves de Stripe al repositorio.**

## Scripts disponibles

```bash
npm run start:dev   # Desarrollo con recarga automática
npm run build       # Compila a /dist
npm run start:prod  # Ejecuta el build
npm run lint        # Oxlint
npm run test        # Pruebas unitarias
```
