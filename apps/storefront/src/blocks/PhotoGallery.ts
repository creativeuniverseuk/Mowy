import type { Block } from "payload"

const PhotoGallery: Block = {
  slug: "photoGallery",
  labels: {
    singular: "Photo Gallery",
    plural: "Photo Galleries",
  },
  fields: [
    {
      name: "images",
      type: "array",
      labels: {
        singular: "Image",
        plural: "Images",
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
  ],
}

export default PhotoGallery
