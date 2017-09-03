/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import { Button, Glyphicon, DropdownButton, MenuItem } from 'react-bootstrap';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import TextEditor from '../../components/TextEditor';
import StudyEntityView from '../../components/StudyEntityView';
import s from './StudyEntity.css';

class StudyEntity extends React.Component {
  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.any.isRequired,
  };
  static propTypes = {
    course: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }).isRequired,
    studyEntity: PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      body: PropTypes.string,
    }).isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      editMode: false,
      title: this.props.studyEntity.title,
      body: this.props.studyEntity.body,
      answerId: null,
      answer: {},
    };
    this.switchMode = this.switchMode.bind(this);
    this.changeTitle = this.changeTitle.bind(this);
    this.changeBody = this.changeBody.bind(this);
    this.changeAnswer = this.changeAnswer.bind(this);
    this.saveAnswer = this.saveAnswer.bind(this);
    this.save = this.save.bind(this);
    this.cancel = this.cancel.bind(this);
    this.selectAnswer = this.selectAnswer.bind(this);
  }

  componentWillMount() {
    if (this.context.store.getState().user) {
      this.retrieveAnswer();
    }
  }

  changeTitle(event) {
    this.setState({ title: event.target.value });
  }

  changeBody(val) {
    this.setState({ body: val });
  }

  changeAnswer(val) {
    this.setState({ answer: val });
  }

  async saveAnswer() {
    if (this.state.answerId) {
      await this.context.fetch('/graphql', {
        body: JSON.stringify({
          query: `mutation update(
            $body: String,
            $id: String
          ){
            updateAnswer(
              body: $body,
              id: $id
            ){
              id
            }            
          }`,
          variables: {
            body: JSON.stringify(this.state.answer),
            id: this.state.answerId,
          },
        }),
      });
    } else {
      await this.context.fetch('/graphql', {
        body: JSON.stringify({
          query: `mutation add(
            $body: String,
            $courseId: String,
            $userId: String,
            $studyEntityId: String
          ){
            addAnswer(
              body: $body,
              courseId: $courseId,
              userId: $userId,
              studyEntityId: $studyEntityId
            ){
              id
            }            
          }`,
          variables: {
            body: JSON.stringify(this.state.answer),
            courseId: this.props.course.id,
            userId: this.context.store.getState().user.id,
            studyEntityId: this.props.studyEntity.id,
          },
        }),
      });
    }
  }

  switchMode() {
    this.setState({ editMode: !this.state.editMode });
  }

  async save() {
    await this.context.fetch('/graphql', {
      body: JSON.stringify({
        query: `mutation create($title: String, $id: String, $body: String) {
          updateStudyEntity(
            title: $title,
            id: $id,
            body: $body,
          ){
            id,title  
          }            
        }`,
        variables: {
          title: this.state.title,
          id: this.props.studyEntity.id,
          body: this.state.body,
        },
      }),
    });
    this.switchMode();
  }

  cancel() {
    // TODO: change cancel bahaviour when user save values once
    this.setState({
      editMode: false,
      title: this.props.studyEntity.title,
      body: this.props.studyEntity.body,
    });
  }

  async retrieveAnswer() {
    const resp = await this.context.fetch('/graphql', {
      body: JSON.stringify({
        query: `query retrieveAnswers (
          $userIds: [String]
          $studyEntityIds: [String]
          $courseIds: [String]
        ){
          answers(
            userIds: $userIds,
            studyEntityIds: $studyEntityIds,
            courseIds: $courseIds
          ){
            id, body
          }            
        }`,
        variables: {
          userIds: !this.context.store.getState().user.isAdmin
            ? [this.context.store.getState().user.id]
            : null,
          studyEntityIds: [this.props.studyEntity.id],
          courseIds: [this.props.course.id],
        },
      }),
    });
    const { data } = await resp.json();
    if (data && data.answers && data.answers.length) {
      const answerCur = 0;
      this.setState({
        answers: data.answers.map(answer => {
          const ans = answer;
          ans.body = JSON.parse(answer.body);
          return ans;
        }),
        answerId: data.answers[answerCur].id,
        answer: data.answers[answerCur].body,
        answerCur,
      });
    }
  }

  selectAnswer(eventKey) {
    const answerCur = parseInt(eventKey, 10);
    this.setState({
      answerCur,
      answer: this.state.answers[answerCur].body,
      answerId: this.state.answers[answerCur].id,
    });
  }

  render() {
    let bodyComponent;
    let headerComponent;
    if (this.state.editMode) {
      bodyComponent = (
        <TextEditor value={this.state.body} onChange={this.changeBody} />
      );
      headerComponent = (
        <span>
          <input
            value={this.state.title}
            type="text"
            onChange={this.changeTitle}
          />
          <Button onClick={this.save}>
            <Glyphicon glyph="ok" />
          </Button>
          <Button onClick={this.cancel}>
            <Glyphicon glyph="remove" />
          </Button>
        </span>
      );
    } else {
      bodyComponent = (
        <span>
          <StudyEntityView
            answerId={this.state.answerId}
            value={this.state.answer}
            body={this.state.body}
            onChange={this.changeAnswer}
          />
          {this.context.store.getState().user
            ? <Button onClick={this.saveAnswer}>Save</Button>
            : undefined}
        </span>
      );
      headerComponent = (
        <span>
          {this.state.title}
          <Button onClick={this.switchMode}>
            <Glyphicon glyph="pencil" />
          </Button>
        </span>
      );
    }
    const user = this.context.store.getState().user;
    let answerChooser;
    if (user && user.isAdmin && this.state.answers) {
      const answers = this.state.answers.map((answer, i) =>
        <MenuItem
          key={answer.id}
          eventKey={i}
          active={i === this.state.answerCur}
        >
          {answer.id}
        </MenuItem>,
      );
      answerChooser = (
        <DropdownButton
          id="answer_chooser"
          title={this.state.answers[this.state.answerCur].id}
          onSelect={this.selectAnswer}
        >
          {answers}
        </DropdownButton>
      );
    }

    return (
      <div className={s.root}>
        <div className={s.container}>
          <h1>
            {this.props.course.title}/{headerComponent}
            {answerChooser}
          </h1>
          {bodyComponent}
        </div>
      </div>
    );
  }
}

export default withStyles(s)(StudyEntity);
