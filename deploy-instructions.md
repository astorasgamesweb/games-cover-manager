# Instrucciones para Desplegar Edge Functions

## El error 404 indica que las Edge Functions no están desplegadas en Supabase.

### Opción 1: Usar el botón "Connect to Supabase" en Bolt
1. Haz clic en "Connect to Supabase" en la esquina superior derecha
2. Las funciones se desplegarán automáticamente

### Opción 2: Despliegue manual con Supabase CLI

#### 1. Instalar Supabase CLI
```bash
npm install -g supabase
```

#### 2. Iniciar sesión
```bash
supabase login
```

#### 3. Vincular proyecto
```bash
supabase link --project-ref TU_PROJECT_ID
```

#### 4. Configurar variables de entorno
```bash
supabase secrets set STEAMGRIDDB_API_KEY=tu_api_key_aqui
```

**Nota**: Las credenciales de IGDB ya están configuradas en el código y se genera automáticamente el access token.

#### 5. Desplegar funciones
```bash
supabase functions deploy search-covers
supabase functions deploy get-covers
supabase functions deploy get-igdb-covers
```

### Verificar despliegue
1. Ve a tu dashboard de Supabase
2. Navega a "Edge Functions"
3. Deberías ver las funciones listadas
4. Prueba las URLs:
   - `https://tu-project.supabase.co/functions/v1/search-covers`
   - `https://tu-project.supabase.co/functions/v1/get-covers`
   - `https://tu-project.supabase.co/functions/v1/get-igdb-covers`

### Variables de entorno requeridas en Supabase:
- `STEAMGRIDDB_API_KEY`: Tu API key de SteamGridDB

**Nota**: Las credenciales de IGDB (Client ID: a78bukj82ys6jskweubwi6ihy06uml) ya están integradas en el código y el access token se genera automáticamente.

-H 'Content-Type: application/x-www-form-urlencoded' \
-d 'client_id=TU_CLIENT_ID&client_secret=TU_CLIENT_SECRET&grant_type=client_credentials'
Una vez desplegadas las funciones, la aplicación debería funcionar correctamente.