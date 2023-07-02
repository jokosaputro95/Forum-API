const CommentRepository = require('../../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../../Domains/threads/ThreadRepository');
const DeleteCommentUseCase = require('../DeleteCommentUseCase');

describe('DeleteCommentUseCase', () => {
    it('should orchestracting the delete comment action correctly', async () => {
        // Arrange
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockCommentRepository.deleteCommentById = jest.fn()
            .mockImplementation(() => Promise.resolve());
        mockThreadRepository.verifyThread = jest.fn()
            .mockImplementation(() => Promise.resolve());

        const usecase = new DeleteCommentUseCase({
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action
        await usecase.execute('thread-123', 'comment-123', 'user-123');

        // Assert
        expect(mockThreadRepository.verifyThread).toBeCalledWith('thread-123');
        expect(mockCommentRepository.deleteCommentById).toBeCalledWith('comment-123', 'user-123');
    });
});
