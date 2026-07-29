export type AnatomySide = "front" | "back";

export type MuscleRegion = {
  id: string;
  label: string;
  muscleGroups: string[];
  side: AnatomySide;
  d: string;
};

export const frontMuscleRegions: MuscleRegion[] = [
  {
    id: "front-neck",
    label: "Neck",
    muscleGroups: ["Neck"],
    side: "front",
    d: "M137 78 C142 72 158 72 163 78 L166 105 C158 111 142 111 134 105 Z",
  },
  {
    id: "front-left-deltoid",
    label: "Left Shoulder",
    muscleGroups: ["Shoulders"],
    side: "front",
    d: "M93 116 C104 98 126 100 134 116 C125 128 109 136 92 132 C85 128 86 121 93 116 Z",
  },
  {
    id: "front-right-deltoid",
    label: "Right Shoulder",
    muscleGroups: ["Shoulders"],
    side: "front",
    d: "M207 116 C196 98 174 100 166 116 C175 128 191 136 208 132 C215 128 214 121 207 116 Z",
  },
  {
    id: "front-left-pec",
    label: "Left Chest",
    muscleGroups: ["Chest"],
    side: "front",
    d: "M104 132 C113 115 138 114 147 132 L145 183 C125 190 106 179 98 160 C96 149 98 139 104 132 Z",
  },
  {
    id: "front-right-pec",
    label: "Right Chest",
    muscleGroups: ["Chest"],
    side: "front",
    d: "M196 132 C187 115 162 114 153 132 L155 183 C175 190 194 179 202 160 C204 149 202 139 196 132 Z",
  },
  {
    id: "front-left-biceps",
    label: "Left Biceps",
    muscleGroups: ["Biceps"],
    side: "front",
    d: "M75 146 C91 144 99 160 96 187 C94 213 84 235 68 232 C58 210 60 166 75 146 Z",
  },
  {
    id: "front-right-biceps",
    label: "Right Biceps",
    muscleGroups: ["Biceps"],
    side: "front",
    d: "M225 146 C209 144 201 160 204 187 C206 213 216 235 232 232 C242 210 240 166 225 146 Z",
  },
  {
    id: "front-left-forearm",
    label: "Left Forearm",
    muscleGroups: ["Forearms"],
    side: "front",
    d: "M61 242 C75 237 84 250 79 280 C75 307 65 331 52 327 C46 299 48 262 61 242 Z",
  },
  {
    id: "front-right-forearm",
    label: "Right Forearm",
    muscleGroups: ["Forearms"],
    side: "front",
    d: "M239 242 C225 237 216 250 221 280 C225 307 235 331 248 327 C254 299 252 262 239 242 Z",
  },
  {
    id: "front-upper-abs",
    label: "Upper Core",
    muscleGroups: ["Core"],
    side: "front",
    d: "M121 190 C134 184 166 184 179 190 L174 252 C159 262 141 262 126 252 Z",
  },
  {
    id: "front-lower-abs",
    label: "Lower Core",
    muscleGroups: ["Core"],
    side: "front",
    d: "M128 260 C142 268 158 268 172 260 L180 326 C164 338 136 338 120 326 Z",
  },
  {
    id: "front-left-quad",
    label: "Left Quad",
    muscleGroups: ["Quads"],
    side: "front",
    d: "M104 348 C124 338 144 351 140 396 L132 498 C116 507 101 497 97 472 C91 418 90 365 104 348 Z",
  },
  {
    id: "front-right-quad",
    label: "Right Quad",
    muscleGroups: ["Quads"],
    side: "front",
    d: "M196 348 C176 338 156 351 160 396 L168 498 C184 507 199 497 203 472 C209 418 210 365 196 348 Z",
  },
  {
    id: "front-left-calf",
    label: "Left Calf",
    muscleGroups: ["Calves"],
    side: "front",
    d: "M103 510 C118 503 132 512 130 548 L124 590 C113 596 101 590 98 568 C95 544 96 520 103 510 Z",
  },
  {
    id: "front-right-calf",
    label: "Right Calf",
    muscleGroups: ["Calves"],
    side: "front",
    d: "M197 510 C182 503 168 512 170 548 L176 590 C187 596 199 590 202 568 C205 544 204 520 197 510 Z",
  },
];

export const backMuscleRegions: MuscleRegion[] = [
  {
    id: "back-neck",
    label: "Neck",
    muscleGroups: ["Neck"],
    side: "back",
    d: "M136 78 C142 72 158 72 164 78 L168 111 C158 117 142 117 132 111 Z",
  },
  {
    id: "back-left-rear-delt",
    label: "Left Rear Delt",
    muscleGroups: ["Shoulders"],
    side: "back",
    d: "M89 121 C103 100 128 102 139 120 C129 135 106 141 90 132 C84 129 84 124 89 121 Z",
  },
  {
    id: "back-right-rear-delt",
    label: "Right Rear Delt",
    muscleGroups: ["Shoulders"],
    side: "back",
    d: "M211 121 C197 100 172 102 161 120 C171 135 194 141 210 132 C216 129 216 124 211 121 Z",
  },
  {
    id: "back-left-lat",
    label: "Left Back",
    muscleGroups: ["Back"],
    side: "back",
    d: "M101 142 C114 120 139 128 146 151 L143 273 C120 268 101 244 94 210 C91 178 93 154 101 142 Z",
  },
  {
    id: "back-right-lat",
    label: "Right Back",
    muscleGroups: ["Back"],
    side: "back",
    d: "M199 142 C186 120 161 128 154 151 L157 273 C180 268 199 244 206 210 C209 178 207 154 199 142 Z",
  },
  {
    id: "back-left-triceps",
    label: "Left Triceps",
    muscleGroups: ["Triceps"],
    side: "back",
    d: "M73 148 C89 147 98 164 95 192 C92 219 82 236 66 232 C58 205 59 167 73 148 Z",
  },
  {
    id: "back-right-triceps",
    label: "Right Triceps",
    muscleGroups: ["Triceps"],
    side: "back",
    d: "M227 148 C211 147 202 164 205 192 C208 219 218 236 234 232 C242 205 241 167 227 148 Z",
  },
  {
    id: "back-left-forearm",
    label: "Left Forearm",
    muscleGroups: ["Forearms"],
    side: "back",
    d: "M61 242 C75 237 84 250 79 280 C75 307 65 331 52 327 C46 299 48 262 61 242 Z",
  },
  {
    id: "back-right-forearm",
    label: "Right Forearm",
    muscleGroups: ["Forearms"],
    side: "back",
    d: "M239 242 C225 237 216 250 221 280 C225 307 235 331 248 327 C254 299 252 262 239 242 Z",
  },
  {
    id: "back-left-glute",
    label: "Left Glute",
    muscleGroups: ["Glutes"],
    side: "back",
    d: "M105 322 C124 304 147 314 149 344 C145 369 125 380 103 365 C95 350 96 333 105 322 Z",
  },
  {
    id: "back-right-glute",
    label: "Right Glute",
    muscleGroups: ["Glutes"],
    side: "back",
    d: "M195 322 C176 304 153 314 151 344 C155 369 175 380 197 365 C205 350 204 333 195 322 Z",
  },
  {
    id: "back-left-hamstring",
    label: "Left Hamstring",
    muscleGroups: ["Hamstrings"],
    side: "back",
    d: "M105 374 C125 363 144 377 140 423 L132 498 C116 507 101 497 97 472 C92 429 91 390 105 374 Z",
  },
  {
    id: "back-right-hamstring",
    label: "Right Hamstring",
    muscleGroups: ["Hamstrings"],
    side: "back",
    d: "M195 374 C175 363 156 377 160 423 L168 498 C184 507 199 497 203 472 C208 429 209 390 195 374 Z",
  },
  {
    id: "back-left-calf",
    label: "Left Calf",
    muscleGroups: ["Calves"],
    side: "back",
    d: "M103 510 C118 503 132 512 130 548 L124 590 C113 596 101 590 98 568 C95 544 96 520 103 510 Z",
  },
  {
    id: "back-right-calf",
    label: "Right Calf",
    muscleGroups: ["Calves"],
    side: "back",
    d: "M197 510 C182 503 168 512 170 548 L176 590 C187 596 199 590 202 568 C205 544 204 520 197 510 Z",
  },
];

export const anatomyMuscleRegions = [
  ...frontMuscleRegions,
  ...backMuscleRegions,
];
