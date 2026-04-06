# 🚀 Guía Técnica: Migración de WhatsApp API (Whapi -> Meta / Otro)

Este documento es una "memoria técnica" para realizar el cambio de proveedor de WhatsApp en la plataforma SaaS. Gracias a la arquitectura modular (Adapter Pattern), el cambio es seguro y no afecta la lógica de negocio.

## 🏗️ 1. Arquitectura de Mensajería Actual

La plataforma utiliza un **Patrón Adapter**. Nada en el "cerebro" del bot (`engine.ts`) sabe que existe Whapi. Todo pasa por una interfaz común.

- **Interfaz**: `src/services/adapters/channel.adapter.ts` (`IChannelAdapter`)
- **Implementación Whapi**: `src/services/adapters/whapi.adapter.ts`
- **Orquestador**: `src/services/message.service.ts`

---

## 🛠️ 2. Pasos para la Migración Técnica

### Paso A: Crear el nuevo Adapter
Crea un archivo `src/services/adapters/meta.adapter.ts` que implemente `IChannelAdapter`.
> Ver la sección "Plantilla MetaAdapter" más abajo.

### Paso B: Registrar el Adapter en MessageService
Modifica `src/services/message.service.ts`. Cambia la instanciación de `WhapiAdapter` por `MetaAdapter` dentro del método `_sendWhatsApp`.

```typescript
// En src/services/message.service.ts
private static async _sendWhatsApp(tenantId: string, message: OutboundMessage): Promise<void> {
  // 1. Obtener credenciales de Meta (Access Token, Phone ID) de la DB
  // 2. Instanciar MetaAdapter en lugar de WhapiAdapter
  const adapter = new MetaAdapter(waAccount.meta_access_token, waAccount.meta_phone_id);
  await adapter.send(message);
}
```

### Paso C: Actualizar el Webhook
Whapi y Meta envían JSONs **completamente diferentes**. Debes ajustar `src/app/api/webhooks/whatsapp/route.ts` para que reconozca la estructura de Meta.

**Estructura de Meta (Simplificada):**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "NUMBER",
          "text": { "body": "CONTENT" }
        }]
      }
    }]
  }]
}
```

### Paso D: Actualizar UI de Ajustes
Modifica `src/app/dashboard/settings/page.tsx` para que los clientes puedan ingresar su `Phone Number ID` y `Permanent Access Token` de Meta en lugar del token de Whapi.

---

## 🔐 3. Credenciales Necesarias (Meta)

Si migras a la **API oficial de Meta**, necesitarás estas variables en tu `.env` (y configurarlas en el Business Manager):

- `META_VERIFY_TOKEN`: Un string aleatorio que configuras en Meta para validar tu Webhook.
- `META_APP_ID` / `META_APP_SECRET`: Para gestión de tokens.
- `META_ACCESS_TOKEN`: Token permanente generado en la consola de desarrolladores.

---

## 📝 4. Plantilla base para MetaAdapter

```typescript
import { IChannelAdapter, OutboundMessage } from './channel.adapter';

export class MetaAdapter implements IChannelAdapter {
  readonly channel = 'whatsapp';

  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string
  ) {}

  async send(message: OutboundMessage): Promise<void> {
    const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
    
    // Convertir botones a formato Meta (Templates o Interactive Messages)
    // Nota: Meta requiere plantillas pre-aprobadas para iniciar conversaciones.
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: message.to,
        type: 'text',
        text: { body: message.text }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Meta API Error: ${JSON.stringify(errorData)}`);
    }
  }
}
```

---

## ⚠️ Consideraciones Críticas (Meta vs Whapi)

1. **Sesiones de 24h**: Whapi permite enviar mensajes en cualquier momento (es un bridge). Meta tiene una "ventana de 24 horas". Fuera de esa ventana, **DEBES** usar Plantillas de Mensaje (Message Templates).
2. **Validación de Webhook**: Meta requiere un endpoint `GET` en tu webhook que responda con un `hub.challenge`. Actualmente el proyecto solo tiene un `GET` que devuelve "OK". Deberás implementar la validación oficial.
3. **Números de Teléfono**: En Whapi usas cualquier número escaneando QR. En Meta, el número debe estar registrado y vinculado a una cuenta de Business Manager.
