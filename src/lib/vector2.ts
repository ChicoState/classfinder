export type Vector2 = {
  x: number;
  y: number;
};

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function multiply(vector: Vector2, scalar: number): Vector2 {
  return { x: vector.x * scalar, y: vector.y * scalar };
}

/** Division by zero follows JavaScript number semantics (Infinity or NaN). */
export function divide(vector: Vector2, scalar: number): Vector2 {
  return { x: vector.x / scalar, y: vector.y / scalar };
}

export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

export function unit(vector: Vector2): Vector2 {
  return divide(vector, magnitude(vector));
}

export function magnitude(vector: Vector2): number {
  return Math.hypot(vector.x, vector.y);
}

export function distance(a: Vector2, b: Vector2): number {
  return magnitude(subtract(a, b));
}

export function angle(a: Vector2, b: Vector2): number {
  return Math.acos(dot(a, b) / (magnitude(a) * magnitude(b)));
}
