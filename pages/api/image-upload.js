import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { decode } from 'base64-arraybuffer';



const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const config = {
    api: {
      bodyParser: {
        sizeLimit: '10mb',
      },
    },
  };

  export default async function handler(req, res) {
        // Upload image to Supabase
// Upload image to Supabase

    if (req.method === 'POST') {
      let { image } = req.body;

      if (!image) {
        return res.status(500).json({ message: 'No image provided' });
      }

      try {
        const contentType = image.match(/data:(.*);base64/)?.[1];
        const base64FileData = image.split('base64,')?.[1];

        if (!contentType || !base64FileData) {
          return res.status(500).json({ message: 'Image data not valid' });
        }

        // Upload image
        const fileName = nanoid();
        const ext = contentType.split('/')[1];
        const path = `supavacation/${fileName}.${ext}`;

        console.log("Uplaod image filename, ext & path", fileName, ext, path)

        // Error Isolation
        const { data, error: uploadError } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET)
          .upload(path, decode(base64FileData), {
            contentType,
            upsert: true,
          });

          console.log("Superbase storage:",data)

          // Error Isolation
          // The Image file name in storage is not the same has what 
          // is found in the path name in SQL table

        if (uploadError) {
          throw new Error('Unable to upload image to storage');
        }

        // Construct public URL
        const url = `${process.env.SUPABASE_URL.replace(
          '.in',
          '.co'
        )}/storage/v1/object/public/${data.path}`;

        console.log('Test 4:',url)
        console.log(data.path)
        console.log(data.Key )
        // https://ovyqcwcpqxyuunpbufrg.supabase.co/storage/v1/object/public/supa/amsterdam.jpeg?t=2023-05-08T19%3A04%3A56.135Z

        return res.status(200).json({ url });
      } catch (e) {
        res.status(500).json({ message: 'Something went wrong' });
      }
    }
    // HTTP method not supported!
    else {
      res.setHeader('Allow', ['POST']);
      res
        .status(405)
        .json({ message: `HTTP method ${req.method} is not supported.` });
    }
  }