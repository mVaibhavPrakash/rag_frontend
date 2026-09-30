const getByteArray = async (text: string): Promise<Uint8Array<ArrayBuffer>> => {
    const msgUint8 = new TextEncoder().encode(text);
      
      // 2. Hash using browser-native SHA-256
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      
      // 3. Convert the buffer to a byte array (mimics Node.js Buffer behavior)
      return new Uint8Array(hashBuffer);
};
