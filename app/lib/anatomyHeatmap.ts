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
    id: "chest-upper-left",
    label: "Left Upper Chest",
    muscleGroups: ["Chest"],
    side: "front",
    d: "M104 132 C114 115 138 114 148 133 L146 159 C126 165 107 159 98 148 C98 141 100 136 104 132 Z",
  },
  {
    id: "chest-upper-right",
    label: "Right Upper Chest",
    muscleGroups: ["Chest"],
    side: "front",
    d: "M196 132 C186 115 162 114 152 133 L154 159 C174 165 193 159 202 148 C202 141 200 136 196 132 Z",
  },
  {
    id: "chest-lower-left",
    label: "Left Lower Chest",
    muscleGroups: ["Chest"],
    side: "front",
    d: "M101 154 C114 163 131 168 146 162 L144 190 C126 198 107 186 99 169 C97 163 98 158 101 154 Z",
  },
  {
    id: "chest-lower-right",
    label: "Right Lower Chest",
    muscleGroups: ["Chest"],
    side: "front",
    d: "M199 154 C186 163 169 168 154 162 L156 190 C174 198 193 186 201 169 C203 163 202 158 199 154 Z",
  },
  {
    id: "serratus-anterior-left",
    label: "Left Serratus Anterior",
    muscleGroups: ["Chest", "Core"],
    side: "front",
    d: "M96 178 C105 188 110 207 109 229 L96 250 C90 227 89 196 96 178 Z",
  },
  {
    id: "serratus-anterior-right",
    label: "Right Serratus Anterior",
    muscleGroups: ["Chest", "Core"],
    side: "front",
    d: "M204 178 C195 188 190 207 191 229 L204 250 C210 227 211 196 204 178 Z",
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
    d: "M121 194 C134 187 166 187 179 194 L174 250 C159 260 141 260 126 250 Z",
  },
  {
    id: "front-lower-abs",
    label: "Lower Core",
    muscleGroups: ["Core"],
    side: "front",
    d: "M128 258 C142 267 158 267 172 258 L180 326 C164 338 136 338 120 326 Z",
  },
  {
    id: "obliques-left",
    label: "Left Obliques",
    muscleGroups: ["Core"],
    side: "front",
    d: "M98 254 L121 202 L126 320 C112 319 101 295 98 254 Z",
  },
  {
    id: "obliques-right",
    label: "Right Obliques",
    muscleGroups: ["Core"],
    side: "front",
    d: "M202 254 L179 202 L174 320 C188 319 199 295 202 254 Z",
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
