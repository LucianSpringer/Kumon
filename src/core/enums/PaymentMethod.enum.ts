/**
 * PaymentMethod Enum
 */

export const PaymentMethod = {
    BANK_TRANSFER: 'BANK_TRANSFER',
    VIRTUAL_ACCOUNT: 'VIRTUAL_ACCOUNT',
    E_WALLET_GOPAY: 'E_WALLET_GOPAY',
    E_WALLET_OVO: 'E_WALLET_OVO',
    E_WALLET_DANA: 'E_WALLET_DANA',
    E_WALLET_SHOPEEPAY: 'E_WALLET_SHOPEEPAY',
    CREDIT_CARD: 'CREDIT_CARD',
    QRIS: 'QRIS',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentMethodLabel: Record<PaymentMethod, string> = {
    [PaymentMethod.BANK_TRANSFER]: 'Transfer Bank',
    [PaymentMethod.VIRTUAL_ACCOUNT]: 'Virtual Account',
    [PaymentMethod.E_WALLET_GOPAY]: 'GoPay',
    [PaymentMethod.E_WALLET_OVO]: 'OVO',
    [PaymentMethod.E_WALLET_DANA]: 'DANA',
    [PaymentMethod.E_WALLET_SHOPEEPAY]: 'ShopeePay',
    [PaymentMethod.CREDIT_CARD]: 'Kartu Kredit',
    [PaymentMethod.QRIS]: 'QRIS',
};
