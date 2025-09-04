# Configuración de Supabase para SteamGridDB CSV Manager

## Pasos para configurar el proyecto

### 1. Crear cuenta y proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Anota tu Project URL y anon key

### 2. Configurar variables de entorno locales

1. Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus valores reales:
```env
VITE_SUPABASE_URL=https://tu-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
STEAMGRIDDB_API_KEY=tu-steamgriddb-api-key-aqui
```

### 3. Obtener API Key de SteamGridDB

1. Ve a [SteamGridDB](https://www.steamgriddb.com/)
2. Crea una cuenta o inicia sesión
3. Ve a [Configuración de API](https://www.steamgriddb.com/profile/preferences/api)
4. Genera una nueva API key
5. Copia la API key a tu archivo `.env`

### 4. Configurar Edge Functions en Supabase

#### Opción A: Usando la interfaz web de Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a "Edge Functions" en el menú lateral
3. Crea una nueva función llamada `search-covers`
4. Copia el contenido de `supabase/functions/search-covers/index.ts`
5. Repite para `get-covers`

#### Opción B: Usando Supabase CLI (Recomendado)

1. Instala Supabase CLI:
```bash
npm install -g supabase
```

2. Inicia sesión en Supabase:
```bash
supabase login
```

3. Vincula tu proyecto:
```bash
supabase link --project-ref tu-project-id
```

4. Configura las variables de entorno en Supabase:
```bash
supabase secrets set STEAMGRIDDB_API_KEY=tu-steamgriddb-api-key-aqui
```

5. Despliega las Edge Functions:
```bash
supabase functions deploy search-covers
supabase functions deploy get-covers
```

### 5. Verificar configuración

1. Ve a tu Supabase Dashboard
2. Navega a "Edge Functions"
3. Deberías ver las funciones `search-covers` y `get-covers` listadas
4. Ve a "Settings" > "API" para verificar tus URLs y keys

### 6. Configurar variables de entorno en producción

En el dashboard de Supabase:
1. Ve a "Settings" > "Environment variables"
2. Agrega `STEAMGRIDDB_API_KEY` con tu API key

### 7. Probar la configuración

1. Inicia tu aplicación local:
```bash
npm run dev
```

2. Sube un archivo CSV de prueba
3. Verifica que las funciones respondan correctamente

## Estructura de archivos

```
supabase/
├── config.toml              # Configuración local de Supabase
├── .env.example             # Variables de entorno de ejemplo
├── functions/
│   ├── _shared/
│   │   └── cors.ts          # Configuración CORS compartida
│   ├── search-covers/
│   │   └── index.ts         # Función de búsqueda de covers
│   └── get-covers/
│       └── index.ts         # Función para obtener covers
```

## Solución de problemas

### Error: "STEAMGRIDDB_API_KEY not configured"
- Verifica que hayas configurado la variable de entorno en Supabase
- Asegúrate de que la API key sea válida

### Error: "CORS policy"
- Las funciones ya incluyen configuración CORS
- Verifica que estés usando las URLs correctas

### Error: "Function not found"
- Verifica que las funciones estén desplegadas correctamente
- Revisa los logs en el dashboard de Supabase

## URLs de las funciones

Una vez desplegadas, tus funciones estarán disponibles en:
- `https://tu-project-id.supabase.co/functions/v1/search-covers`
- `https://tu-project-id.supabase.co/functions/v1/get-covers`