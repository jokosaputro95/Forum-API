class DeleteCommentUseCase {
    constructor({ commentRepository, threadRepository }) {
        this._commentRepository = commentRepository;
        this._threadRepository = threadRepository;
    }

    async execute(threadId, commentId, userId) {
        await this._threadRepository.verifyThread(threadId);

        await this._commentRepository.deleteCommentById(commentId, userId);
    }
}

module.exports = DeleteCommentUseCase;
