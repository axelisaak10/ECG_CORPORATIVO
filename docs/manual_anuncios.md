# Manual de Uso: Gestión de Anuncios y Pop-ups
**ECG Corporativo**

Este manual describe el funcionamiento, formatos y administración del sistema de anuncios y pop-ups promocionales/informativos en el portal de **ECG Corporativo**.

---

## 1. Introducción al Sistema de Anuncios

El sistema de anuncios permite a los administradores y trabajadores mostrar ventanas emergentes (pop-ups) al inicio de la sesión del usuario. Estos anuncios pueden configurarse de manera global (para el menú principal del portal) o segmentarse específicamente para cada una de las empresas de la corporación.

### Características Clave:
* **Segmentación por destino:** Elige si el anuncio aparece en el Portal Principal o en la empresa de tu elección.
* **Control de vigencia:** Configura una fecha límite; el anuncio dejará de mostrarse automáticamente después de ese día.
* **Contador regresivo (cuenta atrás):** Los pop-ups calculan y muestran el tiempo restante exacto de vigencia de forma dinámica.
* **Habilitación rápida:** Activa o desactiva anuncios con un solo interruptor sin tener que borrarlos.

---

## 2. Formatos Disponibles

El sistema soporta dos estilos de diseño altamente optimizados:

### A. Modo Estándar (Tarjeta con Texto)
Ideal para avisos informativos, novedades o promociones detalladas.
* **Elementos en pantalla:** Ícono, etiqueta de tipo (badge), título, subtítulo, descripción textual completa, imagen descriptiva (opcional) y un botón de llamada a la acción (CTA) personalizable.
* **Uso recomendado:** Comunicados corporativos, avisos de mantenimiento, lanzamiento de nuevos servicios o promociones explicativas.

### B. Modo Solo Imagen (Banner con Cuenta Atrás)
Diseñado específicamente para campañas de marketing visual u ofertas de alto impacto.
* **Elementos en pantalla:** Únicamente la imagen de tu banner, una etiqueta opcional en la esquina superior izquierda, y una **barra inferior dedicada** para la cuenta atrás.
* **Visualización optimizada:** El pop-up se amplía automáticamente a un formato más grande (`max-w-xl`) y el temporizador se coloca debajo de la foto. De esta manera, **los números nunca tapan los textos o caras** de tu imagen.
* **Interactividad:** Si configuras un enlace, **toda la imagen se vuelve cliqueable**, actuando como un acceso directo a la promoción (por ejemplo, a un chat de WhatsApp o landing page).
* **Uso recomendado:** Flyers de descuentos, ofertas especiales de fin de semana, o posters publicitarios prediseñados.

---

## 3. Guía de Configuración de Campos (Formulario)

Al crear o editar un anuncio, encontrarás los siguientes campos:

| Campo | ¿Obligatorio? | Descripción / Recomendación |
| :--- | :---: | :--- |
| **Tipo** | Sí | Define el color del pop-up y la etiqueta del tipo. Opciones: *Oferta*, *Novedad*, *Evento*, *Aviso* o *Promoción*. |
| **Destino** | Sí | Lugar donde aparecerá el anuncio. Opciones: *Portal Principal* o la empresa correspondiente. |
| **Modo Solo Imagen** | Opcional | Interruptor que cambia el diseño al formato visual de solo imagen (oculta los campos de texto estándar). |
| **URL de la Imagen** | Sí (en Solo Imagen) / Opcional (Estándar) | Enlace directo a la imagen. Debe ser una URL de internet pública (por ejemplo: `https://tuservidor.com/imagen.png`). |
| **Título** | Sí (en Estándar) | Título llamativo del anuncio (se autodefine en el servidor si usas Solo Imagen). |
| **Descripción** | Sí (en Estándar) | Cuerpo del mensaje o términos de la promoción (se autodefine en el servidor si usas Solo Imagen). |
| **Badge** | Opcional | Pequeño texto destacado en fondo amarillo. Ej: `¡GRATIS!`, `30% OFF`, `EXCLUSIVO`. |
| **Link al hacer clic** | Opcional | URL completa a donde se redirigirá al usuario cuando haga clic en la imagen (Solo Imagen) o en el botón (Estándar). Ej: `https://wa.me/521XXXXXXXXXX` |
| **Fecha de vencimiento** | Sí | Fecha límite de la campaña. Se utiliza para calcular el reloj de cuenta atrás. El pop-up expira y desaparece a las 23:59:59 de ese día. |
| **Publicar ya** | Sí | Interruptor de estado del anuncio. Si se apaga, el anuncio se guarda como borrador inactivo. |

---

## 4. Gestión en el Panel Administrativo

### Crear un anuncio
1. Dirígete a la sección de **Gestión de Anuncios** en tu panel administrativo.
2. Haz clic en **"+ Nuevo anuncio"** en la esquina superior derecha.
3. Rellena los campos necesarios y presiona **"Crear anuncio"**.

### Modificar un anuncio
* **Desactivar temporalmente:** Haz clic en el interruptor de estado (icono de interruptor verde/gris) en la lista para ocultar el anuncio instantáneamente sin borrarlo.
* **Editar detalles:** Haz clic en el botón azul de editar (icono de lápiz 📝). Guarda los cambios al terminar.
* **Eliminar permanentemente:** Haz clic en el botón rojo de eliminar (icono de papelera 🗑️) y confirma la acción (disponible únicamente para nivel Administrador o superior).
* **Vista Previa en tiempo real:** Utiliza el botón de ojo (👁️) para ver exactamente cómo se mostrará el pop-up a tus usuarios finales sin necesidad de guardarlo primero.

---

## 5. Referencia Técnica (Base de Datos Supabase)

El sistema opera sobre la tabla `anuncios` en PostgreSQL. A continuación se adjunta la definición de la estructura SQL utilizada:

```sql
CREATE TABLE IF NOT EXISTS anuncios (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        TEXT          NOT NULL,
  subtitulo     TEXT          DEFAULT '',
  cuerpo        TEXT          NOT NULL,
  tipo          TEXT          NOT NULL DEFAULT 'aviso'
                                CHECK (tipo IN ('oferta','novedad','evento','aviso','promocion')),
  icono         TEXT          DEFAULT 'Bell'
                                CHECK (icono IN ('Tag','Zap','Gift','Bell','Sparkles')),
  badge         TEXT          DEFAULT '',
  destino       TEXT          NOT NULL DEFAULT 'portal'
                                CHECK (destino IN ('portal','empresa_1','empresa_2','empresa_3')),
  cta_texto     TEXT          DEFAULT '',
  cta_link      TEXT          DEFAULT '',
  imagen_url    TEXT          DEFAULT '',
  solo_imagen   BOOLEAN       NOT NULL DEFAULT FALSE,
  fecha_fin     DATE          DEFAULT NULL,
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  creado_por    TEXT          NOT NULL DEFAULT '',
  usuario_id    INTEGER,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
```
