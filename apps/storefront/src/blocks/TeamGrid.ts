import type { Block } from "payload"

const TeamGrid: Block = {
  slug: "teamGrid",
  labels: {
    singular: "Team Grid",
    plural: "Team Grids",
  },
  fields: [
    {
      name: "members",
      type: "array",
      labels: {
        singular: "Member",
        plural: "Members",
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "role",
          type: "text",
        },
        {
          name: "photo",
          type: "upload",
          relationTo: "media",
        },
      ],
    },
  ],
}

export default TeamGrid
