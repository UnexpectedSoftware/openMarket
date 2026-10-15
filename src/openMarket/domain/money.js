/**
 * Cents arithmetic for an order total and the invoice issued from that order.
 * One implementation, so the two totals match.
 */

export const multiply = (numberOne, numberTwo) => Number((parseFloat(numberOne) * parseFloat(numberTwo)).toFixed(2)) * 100 / 100;

export const add = (numberOne, numberTwo) => Number((parseFloat(numberOne) + parseFloat(numberTwo)).toFixed(2)) * 100 / 100;
