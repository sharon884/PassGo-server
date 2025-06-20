const generateOrderId = () => {
   const timestamp = Date.now();
   const random = Math.floor(1000 + Math.random() * 9000);
   return `PassGo_${timestamp}_${random}`;
};

module.exports =  { generateOrderId } ;