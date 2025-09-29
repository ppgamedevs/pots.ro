import { toast } from "sonner";

export const useToast = () => {
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "info":
      default:
        toast(message);
        break;
    }
  };

  const showAddToCart = (productName: string) => {
    toast.success(`${productName} a fost adăugat în coș!`, {
      description: "Poți continua să cumpări sau să finalizezi comanda",
      action: {
        label: "Vezi coșul",
        onClick: () => {
          // Navigate to cart
          window.location.href = "/cart";
        },
      },
    });
  };

  const showSave = (message: string = "Salvat cu succes!") => {
    toast.success(message);
  };

  const showError = (message: string = "A apărut o eroare!") => {
    toast.error(message);
  };

  return {
    toast: showToast,
    showAddToCart,
    showSave,
    showError,
  };
};
