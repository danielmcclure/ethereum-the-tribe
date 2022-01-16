
export async function getTokenStatus() {

    try{
        const response = await fetch("https://api.etherscan.io/api?module=account&action=tokentx&address=0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5&startblock=0&endblock=999999999&sort=asc");
        return await response.json();
        console.log(response.json());
    }catch(error) {
        return [];
    }
    
}