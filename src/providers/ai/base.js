class BaseAIProvider {
    constructor() { }

    async generateText(prompt, options = {}) {
        throw new Error("generateText method is not implemented");
    }

    async chat(messages, options = {}) {
        throw new Error("chat method is not implemented");
    }

    async generateImage(prompt, options = {}) {
        throw new Error("generateImage method is not implemented");
    }
}

export default BaseAIProvider;