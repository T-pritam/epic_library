# Supabase Edge Functions

This folder is reserved for Supabase Edge Functions if you need to add server-side functionality in the future.

## Current Status

**No edge functions are required for the MVP.** The app uses:
- Supabase Auth for authentication
- Supabase Database with RLS for data access
- Supabase Storage for file storage
- Client-side EPUB.js for rendering

## Potential Future Edge Functions

If you want to extend the app, here are some edge functions you might add:

### 1. EPUB Metadata Extraction (Server-side)

```typescript
// supabase/functions/extract-metadata/index.ts
// Extract metadata from EPUB files on upload
```

### 2. Cover Image Processing

```typescript
// supabase/functions/process-cover/index.ts
// Resize and optimize cover images
```

### 3. Reading Statistics

```typescript
// supabase/functions/reading-stats/index.ts
// Generate reading statistics and achievements
```

### 4. Export Bookmarks

```typescript
// supabase/functions/export-bookmarks/index.ts
// Export bookmarks and notes to PDF/Markdown
```

## Creating an Edge Function

To create an edge function:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize (if not already done)
supabase init

# Create a new function
supabase functions new function-name

# Deploy the function
supabase functions deploy function-name
```

## Example Edge Function Structure

```typescript
// supabase/functions/example/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Your function logic here

    return new Response(
      JSON.stringify({ message: 'Success' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## Environment Variables

Edge functions have access to these environment variables:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Examples Repository](https://github.com/supabase/supabase/tree/master/examples/edge-functions)
